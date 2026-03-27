use crate::error::DomainError;
use crate::user::{CreateUser, User, UserId};

/// Port for user persistence operations.
pub trait UserRepository: Send + Sync {
    fn create(&self, req: &CreateUser) -> impl Future<Output = Result<User, DomainError>> + Send;

    fn find_by_id(
        &self,
        id: &UserId,
    ) -> impl Future<Output = Result<Option<User>, DomainError>> + Send;

    fn find_by_email(
        &self,
        email: &str,
    ) -> impl Future<Output = Result<Option<User>, DomainError>> + Send;

    fn update_password(
        &self,
        id: &UserId,
        new_password: &str,
    ) -> impl Future<Output = Result<(), DomainError>> + Send;

    fn count(&self) -> impl Future<Output = Result<i64, DomainError>> + Send;
}
