//! Transitional re-export shim.
//!
//! Stage 3 (#507) lifted the user entity, password helper, and
//! `SeaOrmUserRepo` into `kikan::auth`. These re-exports keep
//! `mokumo_db::user::*` call sites compiling while the crate is being
//! dissolved. The shim disappears alongside `crates/db` in S3.1b.

pub mod entity {
    pub use kikan::auth::entity_user::{ActiveModel, Column, Entity, Model, PrimaryKey, Relation};
}

pub mod password {
    pub use kikan::auth::password::{hash_password, verify_password};
}

pub mod repo {
    pub use kikan::auth::SeaOrmUserRepo;
}
