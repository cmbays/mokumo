use mokumo_core::error::DomainError;

pub async fn hash_password(password: String) -> Result<String, DomainError> {
    tokio::task::spawn_blocking(move || password_auth::generate_hash(password))
        .await
        .map_err(|e| DomainError::Internal {
            message: format!("password hash task failed: {e}"),
        })
}

pub async fn verify_password(password: String, hash: String) -> Result<bool, DomainError> {
    tokio::task::spawn_blocking(
        move || match password_auth::verify_password(password, &hash) {
            Ok(()) => Ok(true),
            Err(password_auth::VerifyError::PasswordInvalid) => Ok(false),
            Err(e) => Err(DomainError::Internal {
                message: format!("password verification failed: {e}"),
            }),
        },
    )
    .await
    .map_err(|e| DomainError::Internal {
        message: format!("password verify task failed: {e}"),
    })?
}
