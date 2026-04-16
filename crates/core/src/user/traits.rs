use crate::error::DomainError;
use crate::user::{CreateUser, RoleId, User, UserId};

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

    fn soft_delete_user(
        &self,
        id: &UserId,
        actor_id: UserId,
    ) -> impl Future<Output = Result<User, DomainError>> + Send;

    fn update_user_role(
        &self,
        id: &UserId,
        new_role: RoleId,
        actor_id: UserId,
    ) -> impl Future<Output = Result<User, DomainError>> + Send;

    fn count_active_admins(&self) -> impl Future<Output = Result<u64, DomainError>> + Send;
}
