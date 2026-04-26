//! Platform auth: users, roles, password hashing, the SeaORM repository,
//! and the `axum-login` backend (`Backend`) + session user
//! (`AuthenticatedUser` / `ProfileUserId`).
//!
//! Domain-pure (no shop-vertical identifiers, I1). The HTTP handler layer
//! lives in [`crate::platform::v1::auth`]; route composition is in the
//! vertical's `data_plane_routes` (mokumo-shop's `routes::data_plane_routes`).

pub mod backend;
pub mod domain;
pub mod entity_role;
pub mod entity_user;
pub mod password;
pub mod recovery_artifact;
pub mod repo;
pub mod service;
pub mod user;

pub use backend::{Backend, Credentials};
pub use domain::{CreateUser, Role, RoleId, User, UserId, UserRepository};
pub use repo::SeaOrmUserRepo;
pub use service::UserService;
pub use user::{AuthenticatedUser, ProfileUserId};
