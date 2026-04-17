//! Shop-logo value types.
//!
//! `ShopLogoInfo` is the persisted metadata for the singleton shop logo —
//! its file-extension (whitelisted to `png` / `jpeg` / `webp` by the
//! validator) plus an epoch-millisecond cache-buster used as the query
//! parameter on the `GET /api/shop/logo?v={epoch}` URL.

#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ShopLogoInfo {
    pub extension: String,
    pub updated_at: i64,
}
