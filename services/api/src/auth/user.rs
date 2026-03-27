use axum_login::AuthUser;
use mokumo_core::user::User;

#[derive(Debug, Clone)]
pub struct AuthenticatedUser {
    pub user: User,
    password_hash_bytes: Vec<u8>,
}

impl AuthenticatedUser {
    pub fn new(user: User, password_hash: String) -> Self {
        Self {
            user,
            password_hash_bytes: password_hash.into_bytes(),
        }
    }
}

impl AuthUser for AuthenticatedUser {
    type Id = i64;

    fn id(&self) -> Self::Id {
        self.user.id.get()
    }

    fn session_auth_hash(&self) -> &[u8] {
        &self.password_hash_bytes
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use mokumo_core::user::{RoleId, UserId};

    fn test_user() -> User {
        User {
            id: UserId::new(1),
            email: "admin@shop.local".into(),
            name: "Admin".into(),
            role_id: RoleId::ADMIN,
            is_active: true,
            last_login_at: None,
            created_at: "2026-01-01T00:00:00Z".into(),
            updated_at: "2026-01-01T00:00:00Z".into(),
            deleted_at: None,
        }
    }

    #[test]
    fn auth_user_id_returns_inner_id() {
        let auth_user = AuthenticatedUser::new(test_user(), "$argon2id$hash".into());
        assert_eq!(auth_user.id(), 1);
    }

    #[test]
    fn session_auth_hash_returns_password_bytes() {
        let hash = "$argon2id$v=19$m=19456,t=2,p=1$salt$hash";
        let auth_user = AuthenticatedUser::new(test_user(), hash.into());
        assert_eq!(auth_user.session_auth_hash(), hash.as_bytes());
    }

    #[test]
    fn different_password_hash_produces_different_session_hash() {
        let user = test_user();
        let user1 = AuthenticatedUser::new(user.clone(), "hash_a".into());
        let user2 = AuthenticatedUser::new(user, "hash_b".into());
        assert_ne!(user1.session_auth_hash(), user2.session_auth_hash());
    }
}
