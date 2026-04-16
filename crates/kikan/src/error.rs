use crate::migrations::{GraftId, MigrationRef};

#[derive(Debug, thiserror::Error)]
pub enum DagError {
    #[error("cycle detected: {}", format_path(path))]
    Cycle { path: Vec<MigrationRef> },

    #[error("dangling dependency: {from} depends on {to} which does not exist")]
    DanglingRef {
        from: MigrationRef,
        to: MigrationRef,
    },

    #[error("duplicate migration {name} in graft {graft}")]
    DuplicateMigration { graft: GraftId, name: &'static str },

    #[error(
        "cross-target dependency: Meta migration {meta} cannot depend on PerProfile migration {per_profile}"
    )]
    CrossTargetViolation {
        meta: MigrationRef,
        per_profile: MigrationRef,
    },
}

fn format_path(path: &[MigrationRef]) -> String {
    path.iter()
        .map(|r| r.to_string())
        .collect::<Vec<_>>()
        .join(" -> ")
}

#[derive(Debug, thiserror::Error)]
#[error("migration {graft}::{name} failed: {source}")]
pub struct MigrationError {
    pub graft: GraftId,
    pub name: &'static str,
    pub source: sea_orm::DbErr,
}

#[derive(Debug, thiserror::Error)]
pub enum EngineError {
    #[error("boot error: {0}")]
    Boot(String),

    #[error(transparent)]
    Migration(#[from] MigrationError),

    #[error(transparent)]
    Dag(#[from] DagError),

    #[error("database error: {0}")]
    Db(#[from] sea_orm::DbErr),
}

#[derive(Debug, thiserror::Error)]
pub enum TenancyError {
    #[error("profile not found: {profile}")]
    ProfileNotFound { profile: String },

    #[error("database error: {0}")]
    Db(#[from] sea_orm::DbErr),
}

#[derive(Debug, thiserror::Error)]
pub enum AppHandleError {
    #[error("{0}")]
    NotAvailable(String),
}
