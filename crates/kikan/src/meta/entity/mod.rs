//! SeaORM entities for the meta.db schema.
//!
//! Per `adr-entity-type-placement.md`, `DeriveEntityModel` types live with
//! their repo implementation in whichever crate owns the data. The
//! `profiles` table is engine-owned (kikan vocabulary, not shop-vertical),
//! so its entity lives here next to the meta-DB module.

pub mod profile;
