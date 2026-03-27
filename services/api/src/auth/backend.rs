use axum_login::AuthnBackend;
use mokumo_core::error::DomainError;
use mokumo_core::user::UserId;
use mokumo_db::DatabaseConnection;
use mokumo_db::user::password;
use mokumo_db::user::repo::SeaOrmUserRepo;

use super::user::AuthenticatedUser;

#[derive(Debug, Clone, serde::Deserialize)]
pub struct Credentials {
    pub email: String,
    pub password: String,
}

#[derive(Clone)]
pub struct Backend {
    db: DatabaseConnection,
}

impl Backend {
    pub fn new(db: DatabaseConnection) -> Self {
        Self { db }
    }
}

impl AuthnBackend for Backend {
    type User = AuthenticatedUser;
    type Credentials = Credentials;
    type Error = DomainError;

    async fn authenticate(
        &self,
        creds: Self::Credentials,
    ) -> Result<Option<Self::User>, Self::Error> {
        let repo = SeaOrmUserRepo::new(self.db.clone());
        let Some((user, hash)) = repo.find_by_email_with_hash(&creds.email).await? else {
            return Ok(None);
        };

        if !user.is_active {
            return Ok(None);
        }

        let is_valid = password::verify_password(creds.password, hash.clone()).await?;
        if is_valid {
            Ok(Some(AuthenticatedUser::new(user, hash)))
        } else {
            Ok(None)
        }
    }

    async fn get_user(&self, user_id: &i64) -> Result<Option<Self::User>, Self::Error> {
        let repo = SeaOrmUserRepo::new(self.db.clone());
        let id = UserId::new(*user_id);
        let Some((user, hash)) = repo.find_by_id_with_hash(&id).await? else {
            return Ok(None);
        };
        Ok(Some(AuthenticatedUser::new(user, hash)))
    }
}
