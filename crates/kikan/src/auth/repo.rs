use mokumo_core::activity::ActivityAction;
use mokumo_core::error::DomainError;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ColumnTrait, ConnectionTrait, DatabaseConnection, EntityTrait,
    PaginatorTrait, QueryFilter, TransactionTrait,
};

use super::domain::{CreateUser, RoleId, User, UserId, UserRepository};
use super::entity_user::{self as entity, Entity as UserEntity};
use super::password;

fn sea_err(e: sea_orm::DbErr) -> DomainError {
    DomainError::Internal {
        message: e.to_string(),
    }
}

impl From<entity::Model> for User {
    fn from(m: entity::Model) -> Self {
        User {
            id: UserId::new(m.id),
            email: m.email,
            name: m.name,
            role_id: RoleId::new(m.role_id),
            is_active: m.is_active,
            last_login_at: m.last_login_at,
            created_at: m.created_at,
            updated_at: m.updated_at,
            deleted_at: m.deleted_at,
        }
    }
}

async fn log_user_activity(
    conn: &impl ConnectionTrait,
    user: &User,
    action: ActivityAction,
) -> Result<(), DomainError> {
    let payload = serde_json::to_value(user).map_err(|e| DomainError::Internal {
        message: format!("failed to serialize user for activity log: {e}"),
    })?;
    crate::activity::insert_activity_log_raw(
        conn,
        "user",
        &user.id.to_string(),
        action,
        &user.id.to_string(),
        "user",
        &payload,
    )
    .await
}

fn split_user_and_hash(m: entity::Model) -> (User, String) {
    let hash = m.password_hash.clone();
    (User::from(m), hash)
}

fn is_sqlite_busy_domain(err: &DomainError) -> bool {
    matches!(err, DomainError::Internal { message } if message.contains("database is locked"))
}

async fn generate_recovery_codes() -> Result<(Vec<String>, String), DomainError> {
    let plaintext_codes: Vec<String> = {
        use rand::RngExt;
        let mut rng = rand::rng();
        (0..10)
            .map(|_| {
                let mut code = String::with_capacity(9);
                for i in 0..8 {
                    if i == 4 {
                        code.push('-');
                    }
                    let c = match rng.random_range(0..36u8) {
                        n @ 0..=9 => (b'0' + n) as char,
                        n => (b'a' + n - 10) as char,
                    };
                    code.push(c);
                }
                code
            })
            .collect()
    };

    let mut hashed_codes = Vec::with_capacity(plaintext_codes.len());
    for code in &plaintext_codes {
        let hash = password::hash_password(code.replace('-', "")).await?;
        hashed_codes.push(serde_json::json!({"hash": hash, "used": false}));
    }
    let recovery_json =
        serde_json::to_string(&hashed_codes).map_err(|e| DomainError::Internal {
            message: format!("failed to serialize recovery codes: {e}"),
        })?;

    Ok((plaintext_codes, recovery_json))
}

pub struct SeaOrmUserRepo {
    db: DatabaseConnection,
}

impl SeaOrmUserRepo {
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }

    pub async fn log_auth_activity(
        &self,
        user: &User,
        action: ActivityAction,
    ) -> Result<(), DomainError> {
        log_user_activity(&self.db, user, action).await
    }

    pub async fn find_by_email_with_hash(
        &self,
        email: &str,
    ) -> Result<Option<(User, String)>, DomainError> {
        let model = UserEntity::find()
            .filter(entity::Column::Email.eq(email))
            .filter(entity::Column::DeletedAt.is_null())
            .one(&self.db)
            .await
            .map_err(sea_err)?;

        Ok(model.map(split_user_and_hash))
    }

    pub async fn find_by_id_with_hash(
        &self,
        id: &UserId,
    ) -> Result<Option<(User, String)>, DomainError> {
        let model = UserEntity::find_by_id(id.get())
            .filter(entity::Column::DeletedAt.is_null())
            .one(&self.db)
            .await
            .map_err(sea_err)?;

        Ok(model.map(split_user_and_hash))
    }

    pub async fn create_admin_with_setup(
        &self,
        email: &str,
        name: &str,
        password: &str,
        shop_name: &str,
    ) -> Result<(User, Vec<String>), DomainError> {
        let password_hash = password::hash_password(password.to_string()).await?;
        let (plaintext_codes, recovery_json) = generate_recovery_codes().await?;

        let txn = self.db.begin().await.map_err(sea_err)?;

        let active = entity::ActiveModel {
            id: ActiveValue::NotSet,
            email: ActiveValue::Set(email.to_string()),
            name: ActiveValue::Set(name.to_string()),
            password_hash: ActiveValue::Set(password_hash),
            role_id: ActiveValue::Set(RoleId::ADMIN.get()),
            is_active: ActiveValue::Set(true),
            last_login_at: ActiveValue::NotSet,
            recovery_code_hash: ActiveValue::Set(Some(recovery_json)),
            created_at: ActiveValue::NotSet,
            updated_at: ActiveValue::NotSet,
            deleted_at: ActiveValue::NotSet,
        };

        let model = active.insert(&txn).await.map_err(sea_err)?;
        let user = User::from(model);

        txn.execute_raw(sea_orm::Statement::from_sql_and_values(
            sea_orm::DbBackend::Sqlite,
            "INSERT INTO settings (key, value) VALUES ('setup_complete', 'true')",
            vec![],
        ))
        .await
        .map_err(sea_err)?;

        txn.execute_raw(sea_orm::Statement::from_sql_and_values(
            sea_orm::DbBackend::Sqlite,
            "INSERT OR REPLACE INTO settings (key, value) VALUES ('shop_name', ?)",
            vec![sea_orm::Value::from(shop_name.to_string())],
        ))
        .await
        .map_err(sea_err)?;

        log_user_activity(&txn, &user, ActivityAction::SetupCompleted).await?;

        txn.commit().await.map_err(sea_err)?;
        Ok((user, plaintext_codes))
    }

    pub async fn recovery_codes_remaining(&self, id: &UserId) -> Result<u32, DomainError> {
        let pool = self.db.get_sqlite_connection_pool();
        let json: Option<String> = sqlx::query_scalar(
            "SELECT recovery_code_hash FROM users WHERE id = ? AND deleted_at IS NULL",
        )
        .bind(id.get())
        .fetch_optional(pool)
        .await
        .map_err(|e| DomainError::Internal {
            message: format!("failed to query recovery codes: {e}"),
        })?
        .flatten();

        let json = match json {
            Some(j) => j,
            None => return Ok(0),
        };

        let codes: Vec<serde_json::Value> =
            serde_json::from_str(&json).map_err(|e| DomainError::Internal {
                message: format!("failed to parse recovery codes: {e}"),
            })?;

        let remaining = codes
            .iter()
            .filter(|entry| {
                entry
                    .get("used")
                    .and_then(|v| v.as_bool())
                    .map(|used| !used)
                    .unwrap_or(false)
            })
            .count();

        Ok(remaining as u32)
    }

    pub async fn regenerate_recovery_codes(&self, id: &UserId) -> Result<Vec<String>, DomainError> {
        let (plaintext_codes, recovery_json) = generate_recovery_codes().await?;

        let txn = self.db.begin().await.map_err(sea_err)?;

        let active = entity::ActiveModel {
            id: ActiveValue::Unchanged(id.get()),
            recovery_code_hash: ActiveValue::Set(Some(recovery_json)),
            ..Default::default()
        };
        active.update(&txn).await.map_err(sea_err)?;

        let user = User::from(
            UserEntity::find_by_id(id.get())
                .one(&txn)
                .await
                .map_err(sea_err)?
                .ok_or_else(|| DomainError::NotFound {
                    entity: "user",
                    id: id.to_string(),
                })?,
        );

        log_user_activity(&txn, &user, ActivityAction::RecoveryCodesRegenerated).await?;
        txn.commit().await.map_err(sea_err)?;

        Ok(plaintext_codes)
    }

    pub async fn verify_and_use_recovery_code(
        &self,
        email: &str,
        recovery_code: &str,
        new_password: &str,
    ) -> Result<bool, DomainError> {
        let normalized = recovery_code.replace('-', "");
        let new_hash = password::hash_password(new_password.to_string()).await?;

        for attempt in 0..3u64 {
            let result: Result<bool, DomainError> = async {
                let txn = self.db.begin().await.map_err(sea_err)?;

                let model = UserEntity::find()
                    .filter(entity::Column::Email.eq(email))
                    .filter(entity::Column::DeletedAt.is_null())
                    .one(&txn)
                    .await
                    .map_err(sea_err)?;

                let model = match model {
                    Some(m) => m,
                    None => return Ok(false),
                };

                let recovery_json = match &model.recovery_code_hash {
                    Some(json) => json.clone(),
                    None => return Ok(false),
                };

                let mut codes: Vec<serde_json::Value> = serde_json::from_str(&recovery_json)
                    .map_err(|e| DomainError::Internal {
                        message: format!("failed to parse recovery codes: {e}"),
                    })?;

                let mut matched_index = None;
                for (i, entry) in codes.iter().enumerate() {
                    let used = entry.get("used").and_then(|v| v.as_bool()).unwrap_or(true);
                    if used {
                        continue;
                    }
                    let hash = entry
                        .get("hash")
                        .and_then(|v| v.as_str())
                        .unwrap_or_default();
                    if password::verify_password(normalized.clone(), hash.to_string()).await? {
                        matched_index = Some(i);
                        break;
                    }
                }

                let matched_index = match matched_index {
                    Some(i) => i,
                    None => return Ok(false),
                };

                codes[matched_index]["used"] = serde_json::Value::Bool(true);
                let updated_json =
                    serde_json::to_string(&codes).map_err(|e| DomainError::Internal {
                        message: format!("failed to serialize updated recovery codes: {e}"),
                    })?;

                let update_result = UserEntity::update_many()
                    .col_expr(
                        entity::Column::PasswordHash,
                        sea_orm::sea_query::Expr::value(new_hash.clone()),
                    )
                    .col_expr(
                        entity::Column::RecoveryCodeHash,
                        sea_orm::sea_query::Expr::value(updated_json),
                    )
                    .filter(entity::Column::Id.eq(model.id))
                    .filter(entity::Column::RecoveryCodeHash.eq(recovery_json))
                    .exec(&txn)
                    .await
                    .map_err(sea_err)?;

                if update_result.rows_affected == 0 {
                    txn.rollback().await.map_err(sea_err)?;
                    return Ok(false);
                }

                let user = User::from(
                    UserEntity::find_by_id(model.id)
                        .one(&txn)
                        .await
                        .map_err(sea_err)?
                        .ok_or_else(|| DomainError::Internal {
                            message: "user disappeared mid-transaction".into(),
                        })?,
                );

                log_user_activity(&txn, &user, ActivityAction::PasswordReset).await?;
                txn.commit().await.map_err(sea_err)?;
                Ok(true)
            }
            .await;

            match result {
                Ok(val) => return Ok(val),
                Err(ref err) if is_sqlite_busy_domain(err) => {
                    if attempt < 2 {
                        let backoff_ms = 50 * (attempt + 1);
                        tracing::warn!(
                            attempt = attempt + 1,
                            backoff_ms,
                            "SQLITE_BUSY during recovery code verification, retrying"
                        );
                        tokio::time::sleep(std::time::Duration::from_millis(backoff_ms)).await;
                        continue;
                    }
                    break;
                }
                Err(err) => return Err(err),
            }
        }

        Err(DomainError::Internal {
            message: "recovery code verification failed: database busy after retries".into(),
        })
    }
}

impl UserRepository for SeaOrmUserRepo {
    async fn create(&self, req: &CreateUser) -> Result<User, DomainError> {
        let password_hash = password::hash_password(req.password.clone()).await?;

        let txn = self.db.begin().await.map_err(sea_err)?;

        let active = entity::ActiveModel {
            id: ActiveValue::NotSet,
            email: ActiveValue::Set(req.email.clone()),
            name: ActiveValue::Set(req.name.clone()),
            password_hash: ActiveValue::Set(password_hash),
            role_id: ActiveValue::Set(req.role_id.get()),
            is_active: ActiveValue::Set(true),
            last_login_at: ActiveValue::NotSet,
            recovery_code_hash: ActiveValue::NotSet,
            created_at: ActiveValue::NotSet,
            updated_at: ActiveValue::NotSet,
            deleted_at: ActiveValue::NotSet,
        };

        let model = active.insert(&txn).await.map_err(sea_err)?;
        let user = User::from(model);

        log_user_activity(&txn, &user, ActivityAction::Created).await?;

        txn.commit().await.map_err(sea_err)?;
        Ok(user)
    }

    async fn find_by_id(&self, id: &UserId) -> Result<Option<User>, DomainError> {
        let model = UserEntity::find_by_id(id.get())
            .filter(entity::Column::DeletedAt.is_null())
            .one(&self.db)
            .await
            .map_err(sea_err)?;
        Ok(model.map(User::from))
    }

    async fn find_by_email(&self, email: &str) -> Result<Option<User>, DomainError> {
        let model = UserEntity::find()
            .filter(entity::Column::Email.eq(email))
            .filter(entity::Column::DeletedAt.is_null())
            .one(&self.db)
            .await
            .map_err(sea_err)?;
        Ok(model.map(User::from))
    }

    async fn update_password(&self, id: &UserId, new_password: &str) -> Result<(), DomainError> {
        let new_hash = password::hash_password(new_password.to_string()).await?;

        let txn = self.db.begin().await.map_err(sea_err)?;

        let active = entity::ActiveModel {
            id: ActiveValue::Unchanged(id.get()),
            password_hash: ActiveValue::Set(new_hash),
            ..Default::default()
        };
        active.update(&txn).await.map_err(sea_err)?;

        let user = User::from(
            UserEntity::find_by_id(id.get())
                .one(&txn)
                .await
                .map_err(sea_err)?
                .ok_or_else(|| DomainError::NotFound {
                    entity: "user",
                    id: id.to_string(),
                })?,
        );

        log_user_activity(&txn, &user, ActivityAction::PasswordChanged).await?;
        txn.commit().await.map_err(sea_err)?;
        Ok(())
    }

    async fn count(&self) -> Result<i64, DomainError> {
        let count = UserEntity::find()
            .filter(entity::Column::DeletedAt.is_null())
            .count(&self.db)
            .await
            .map_err(sea_err)?;
        Ok(count as i64)
    }
}
