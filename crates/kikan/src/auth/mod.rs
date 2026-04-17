//! Platform auth: users, roles, password hashing, and the SeaORM repository.
//!
//! Stage 3 (#507) lifted these from `crates/core` (domain types) and
//! `crates/db` (entities + repo) into kikan. Handler-layer code
//! (login/logout/recover/reset) moves in the next commit (S2.1c).

pub mod domain;
pub mod entity_role;
pub mod entity_user;
pub mod password;
pub mod repo;

pub use domain::{CreateUser, Role, RoleId, User, UserId, UserRepository};
pub use repo::SeaOrmUserRepo;
