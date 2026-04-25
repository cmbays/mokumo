//! `meta.profiles` domain type, repository port, and SeaORM adapter.
//!
//! This is the runtime profile registry — the install-level list of
//! profile slugs the engine can route to. Each row is a tenant in
//! kikan's multi-profile model. `kind` is opaque to kikan (its vocabulary
//! is owned by the vertical's `Graft::ProfileKind`), but kikan owns the
//! storage and lookup surface.
//!
//! PR A wave A0.1 ships the bare-minimum surface needed to compile the
//! call sites the meta-DB foundation introduces. PR B wave B0.1 fleshes
//! the trait out with the operator-facing CRUD (rename, archive,
//! reactivate, hard-delete, etc.).

use sea_orm::entity::prelude::*;
use sea_orm::{DatabaseConnection, EntityTrait, QueryOrder};
use thiserror::Error;

use super::entity::profile as profile_entity;
use crate::slug::Slug;

/// Runtime profile registry entry.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Profile {
    pub slug: Slug,
    pub display_name: String,
    /// Vertical-supplied profile-kind string (matches the `Graft::ProfileKind`
    /// `Display` form).
    pub kind: String,
    pub created_at: String,
    pub updated_at: String,
    /// Soft-archive timestamp (ISO-8601). `None` means the profile is active.
    pub archived_at: Option<String>,
}

/// Errors surfaced by [`ProfileRepo`].
#[derive(Debug, Error)]
pub enum ProfileRepoError {
    #[error("database error: {0}")]
    Db(#[from] sea_orm::DbErr),

    #[error("row from `meta.profiles` has invalid slug `{slug}`: {source}")]
    InvalidSlug {
        slug: String,
        #[source]
        source: crate::slug::SlugError,
    },
}

/// Port for `meta.profiles` persistence.
///
/// Implementations live next to this trait. The PR A wave A0.1 surface is
/// intentionally narrow — `list_active` covers the boot-time enumerator
/// path. Operator CRUD methods land in PR B.
pub trait ProfileRepo: Send + Sync {
    fn list_active(
        &self,
    ) -> impl std::future::Future<Output = Result<Vec<Profile>, ProfileRepoError>> + Send;
}

/// SeaORM-backed implementation of [`ProfileRepo`] reading from the meta
/// pool.
pub struct SeaOrmProfileRepo {
    pool: DatabaseConnection,
}

impl SeaOrmProfileRepo {
    pub fn new(pool: DatabaseConnection) -> Self {
        Self { pool }
    }
}

fn model_to_profile(m: profile_entity::Model) -> Result<Profile, ProfileRepoError> {
    let slug = Slug::new(m.slug.clone()).map_err(|source| ProfileRepoError::InvalidSlug {
        slug: m.slug,
        source,
    })?;
    Ok(Profile {
        slug,
        display_name: m.display_name,
        kind: m.kind,
        created_at: m.created_at,
        updated_at: m.updated_at,
        archived_at: m.archived_at,
    })
}

impl ProfileRepo for SeaOrmProfileRepo {
    async fn list_active(&self) -> Result<Vec<Profile>, ProfileRepoError> {
        use profile_entity::Column;
        let rows = profile_entity::Entity::find()
            .filter(Column::ArchivedAt.is_null())
            .order_by_asc(Column::Slug)
            .all(&self.pool)
            .await?;
        rows.into_iter().map(model_to_profile).collect()
    }
}
