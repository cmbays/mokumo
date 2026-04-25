//! Profile slug — kebab-case identifier used as the on-disk profile
//! directory name and the primary key of `meta.profiles`.
//!
//! Slugs are kebab-case ASCII (lowercase letters, digits, hyphens), 1..=60
//! chars, with no leading/trailing hyphen and no `--` runs. They MUST NOT
//! collide with reserved names (see [`RESERVED_SLUGS`]).
//!
//! # Layering
//!
//! The newtype + reserved-list + error enum are stable interfaces consumed
//! by both PR A foundation work and PR B operator CRUD. The
//! [`derive_slug`] body that turns a free-form display name into a slug
//! lands in PR A wave A1.2 (legacy upgrade handler). Until then the
//! function exists as a typed seam so downstream modules can compile
//! against the final signature.

use serde::{Deserialize, Serialize};
use std::fmt;
use std::str::FromStr;

/// Names that cannot be used as a profile slug.
///
/// `demo` is the special demo profile (cannot be created or deleted by the
/// operator). `meta` and `sessions` are install-level filenames that share
/// the data directory with profile folders; allowing them as slugs would
/// shadow the bootstrap files at `<data_dir>/meta.db` and
/// `<data_dir>/sessions.db`.
pub const RESERVED_SLUGS: &[&str] = &["demo", "meta", "sessions"];

/// Maximum slug length, in bytes (also chars — slugs are ASCII).
pub const MAX_SLUG_LEN: usize = 60;

/// Validation errors for [`Slug::new`] and [`derive_slug`].
#[derive(Debug, Clone, PartialEq, Eq, thiserror::Error)]
pub enum SlugError {
    #[error("slug is empty")]
    Empty,
    #[error("slug is {len} chars; max is {max}")]
    TooLong { len: usize, max: usize },
    #[error("slug `{0}` is reserved")]
    Reserved(String),
    #[error("slug `{0}` contains characters outside [a-z0-9-]")]
    InvalidChars(String),
    #[error("slug `{0}` has leading or trailing hyphen, or contains `--`")]
    HyphenLayout(String),
    #[error("slug cannot be derived from input `{input}`")]
    Unparseable { input: String },
}

/// Validated profile slug.
///
/// Construction goes through [`Slug::new`] (already-canonical input) or
/// [`derive_slug`] (free-form display name → slug).
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(transparent)]
pub struct Slug(String);

impl Slug {
    /// Construct a `Slug` from an already-canonical string. Returns the
    /// specific [`SlugError`] for the first rule violated.
    pub fn new(s: impl Into<String>) -> Result<Self, SlugError> {
        let s: String = s.into();
        if s.is_empty() {
            return Err(SlugError::Empty);
        }
        if s.len() > MAX_SLUG_LEN {
            return Err(SlugError::TooLong {
                len: s.len(),
                max: MAX_SLUG_LEN,
            });
        }
        if !s
            .bytes()
            .all(|b| b.is_ascii_lowercase() || b.is_ascii_digit() || b == b'-')
        {
            return Err(SlugError::InvalidChars(s));
        }
        if s.starts_with('-') || s.ends_with('-') || s.contains("--") {
            return Err(SlugError::HyphenLayout(s));
        }
        if RESERVED_SLUGS.contains(&s.as_str()) {
            return Err(SlugError::Reserved(s));
        }
        Ok(Self(s))
    }

    /// Borrow the slug as a `&str`.
    pub fn as_str(&self) -> &str {
        &self.0
    }

    /// Consume the wrapper and return the inner `String`.
    pub fn into_inner(self) -> String {
        self.0
    }
}

impl fmt::Display for Slug {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        f.write_str(&self.0)
    }
}

impl FromStr for Slug {
    type Err = SlugError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Self::new(s.to_owned())
    }
}

impl AsRef<str> for Slug {
    fn as_ref(&self) -> &str {
        self.as_str()
    }
}

/// Derive a slug from a free-form display name.
///
/// Rules (lowercase → kebab-case, strip non-`[a-z0-9-]`, collapse `--`,
/// trim hyphens, reject empty / >60 / reserved) are settled in
/// shaping.md §"Slug derivation rules". Implementation lands in PR A wave
/// A1.2 (legacy upgrade handler) where it is first exercised by the
/// upgrade path. PR B's profile CRUD reuses the same function.
pub fn derive_slug(_input: &str) -> Result<Slug, SlugError> {
    unimplemented!("PR A wave A1.2 implements derive_slug");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn new_accepts_valid_kebab_slug() {
        assert_eq!(
            Slug::new("acme-printing").unwrap().as_str(),
            "acme-printing"
        );
    }

    #[test]
    fn new_rejects_empty() {
        assert_eq!(Slug::new(""), Err(SlugError::Empty));
    }

    #[test]
    fn new_rejects_over_max_len() {
        let s = "a".repeat(MAX_SLUG_LEN + 1);
        assert!(matches!(Slug::new(&s), Err(SlugError::TooLong { .. })));
    }

    #[test]
    fn new_rejects_reserved() {
        for name in RESERVED_SLUGS {
            assert!(
                matches!(Slug::new(*name), Err(SlugError::Reserved(_))),
                "expected `{name}` to be reserved"
            );
        }
    }

    #[test]
    fn new_rejects_uppercase() {
        assert!(matches!(Slug::new("Acme"), Err(SlugError::InvalidChars(_))));
    }

    #[test]
    fn new_rejects_underscore() {
        assert!(matches!(
            Slug::new("acme_print"),
            Err(SlugError::InvalidChars(_))
        ));
    }

    #[test]
    fn new_rejects_leading_hyphen() {
        assert!(matches!(
            Slug::new("-acme"),
            Err(SlugError::HyphenLayout(_))
        ));
    }

    #[test]
    fn new_rejects_trailing_hyphen() {
        assert!(matches!(
            Slug::new("acme-"),
            Err(SlugError::HyphenLayout(_))
        ));
    }

    #[test]
    fn new_rejects_double_hyphen() {
        assert!(matches!(
            Slug::new("acme--print"),
            Err(SlugError::HyphenLayout(_))
        ));
    }

    #[test]
    fn from_str_round_trips_through_display() {
        let s = Slug::new("acme-printing").unwrap();
        let s2: Slug = s.to_string().parse().unwrap();
        assert_eq!(s, s2);
    }

    #[test]
    #[should_panic(expected = "PR A wave A1.2")]
    fn derive_slug_is_unimplemented_until_a1_2() {
        let _ = derive_slug("acme printing");
    }
}
