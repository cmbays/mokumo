use sea_orm::entity::prelude::*;

#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(table_name = "profiles")]
pub struct Model {
    /// kebab-case slug; primary key. Matches the on-disk profile directory
    /// name and the `slug` field of the domain `Profile` type.
    #[sea_orm(primary_key, auto_increment = false)]
    pub slug: String,
    pub display_name: String,
    /// Vertical-supplied profile-kind string. Kikan stores it opaquely; the
    /// vertical's `Graft::ProfileKind` `Display`/`FromStr` define the
    /// vocabulary (see `engine.rs::validate_profile_kind`).
    pub kind: String,
    pub created_at: String,
    pub updated_at: String,
    /// Soft-archive timestamp. NULL when the profile is active.
    pub archived_at: Option<String>,
}

#[derive(Copy, Clone, Debug, EnumIter, DeriveRelation)]
pub enum Relation {}

impl ActiveModelBehavior for ActiveModel {}
