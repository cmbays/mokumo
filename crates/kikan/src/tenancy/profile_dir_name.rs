//! `ProfileDirName`: opaque, validated newtype for the on-disk directory
//! name of a profile.
//!
//! Kikan stores per-profile resources (database pool, recovery files,
//! etc.) keyed by a String obtained from `kind.to_string()`. Using a raw
//! `String` at the API boundary invites mixing up a profile name with any
//! other string (username, email, password). `ProfileDirName` wraps an
//! `Arc<str>` so: (a) clone is a refcount bump — no allocation;
//! (b) callers can't accidentally pass an unrelated string where a
//! profile directory is expected; (c) the wrapped value is guaranteed to
//! be safe to join against a trusted base directory — never empty, never
//! `.` or `..`, no path separators or embedded NUL.
//!
//! The wrapped value must always equal `kind.to_string()` for some
//! `Graft::ProfileKind` variant — the vertical's `Display` + `FromStr`
//! pair is the single source of truth for the string content. Kikan
//! never inspects the contents — it only uses it as a HashMap key, a
//! `Display` target, and a serde field.

use std::sync::Arc;

/// Opaque directory-name key for a profile, sourced from
/// `kind.to_string()`. Kikan never matches on its contents — only
/// stores/compares/displays it.
///
/// # Invariants
///
/// All constructors (`new`, `from_str`, `From<&str>`, `From<String>`,
/// `Deserialize`) validate the input. A `ProfileDirName` in hand is
/// guaranteed to be path-safe: non-empty, not `.` or `..`, no path
/// separator (`/` or `\`), no NUL, no leading `.`.
#[derive(Clone, Debug, PartialEq, Eq, Hash, serde::Serialize)]
#[serde(transparent)]
pub struct ProfileDirName(Arc<str>);

/// Rejection reason returned by [`ProfileDirName::new`] and
/// [`ProfileDirName::parse`]. Printed via `Display` so HTTP adapters can
/// forward it without a dedicated error type.
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum ProfileDirNameError {
    Empty,
    DotOrDotDot,
    PathSeparator,
    LeadingDot,
    InteriorNul,
}

impl std::fmt::Display for ProfileDirNameError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        let s = match self {
            Self::Empty => "profile dir name is empty",
            Self::DotOrDotDot => "profile dir name is `.` or `..`",
            Self::PathSeparator => "profile dir name contains a path separator",
            Self::LeadingDot => "profile dir name starts with `.`",
            Self::InteriorNul => "profile dir name contains a NUL byte",
        };
        f.write_str(s)
    }
}

impl std::error::Error for ProfileDirNameError {}

fn validate(s: &str) -> Result<(), ProfileDirNameError> {
    if s.is_empty() {
        return Err(ProfileDirNameError::Empty);
    }
    if s == "." || s == ".." {
        return Err(ProfileDirNameError::DotOrDotDot);
    }
    if s.starts_with('.') {
        // Also catches hidden-file patterns like ".ssh".
        return Err(ProfileDirNameError::LeadingDot);
    }
    if s.contains('/') || s.contains('\\') {
        return Err(ProfileDirNameError::PathSeparator);
    }
    if s.contains('\0') {
        return Err(ProfileDirNameError::InteriorNul);
    }
    Ok(())
}

impl ProfileDirName {
    /// Construct a validated `ProfileDirName`.
    ///
    /// Returns `Err` if `name` is empty, `.`, `..`, contains a path
    /// separator or NUL, or starts with `.`. Trusted callers (engine boot
    /// from `Graft::all_profile_kinds()`) use [`Self::new_trusted`] when a
    /// validation failure would indicate a Graft invariant violation that
    /// should panic at boot rather than propagate.
    pub fn new(name: impl Into<Arc<str>>) -> Result<Self, ProfileDirNameError> {
        let arc: Arc<str> = name.into();
        validate(&arc)?;
        Ok(Self(arc))
    }

    /// Parse a `&str` into a `ProfileDirName`, validating.
    pub fn parse(s: &str) -> Result<Self, ProfileDirNameError> {
        validate(s)?;
        Ok(Self(Arc::from(s)))
    }

    /// Construct without returning a `Result` — for trusted callers where
    /// a validation failure would signal a programming error.
    ///
    /// # Panics
    ///
    /// Panics if `name` fails the path-safety checks (see [`Self::new`]).
    /// Use in places where the input is already known to satisfy the
    /// invariants — typically `Graft::ProfileKind::to_string()` for a
    /// kind the vertical itself declared.
    pub fn new_trusted(name: impl Into<Arc<str>>) -> Self {
        let arc: Arc<str> = name.into();
        if let Err(e) = validate(&arc) {
            panic!("ProfileDirName::new_trusted received invalid input {arc:?}: {e}");
        }
        Self(arc)
    }

    /// Borrow the inner string.
    pub fn as_str(&self) -> &str {
        &self.0
    }
}

impl std::fmt::Display for ProfileDirName {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        std::fmt::Display::fmt(&*self.0, f)
    }
}

impl AsRef<str> for ProfileDirName {
    fn as_ref(&self) -> &str {
        &self.0
    }
}

impl std::borrow::Borrow<str> for ProfileDirName {
    fn borrow(&self) -> &str {
        &self.0
    }
}

impl std::str::FromStr for ProfileDirName {
    type Err = ProfileDirNameError;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        Self::parse(s)
    }
}

/// `From<&'static str>` stays infallible for the literal-string case
/// used in tests and trusted boot code (Graft-declared dir names surface
/// as `&'static str`). Panics on an invalid literal at the call site — a
/// programmer error, not a user-facing condition.
///
/// For untrusted-string input, use [`ProfileDirName::parse`] or
/// [`ProfileDirName::new`] (both return `Result`); for `String` inputs
/// from trusted sources use [`ProfileDirName::new_trusted`].
impl From<&'static str> for ProfileDirName {
    fn from(s: &'static str) -> Self {
        Self::new_trusted(s)
    }
}

impl<'de> serde::Deserialize<'de> for ProfileDirName {
    fn deserialize<D: serde::Deserializer<'de>>(d: D) -> Result<Self, D::Error> {
        let s: String = serde::Deserialize::deserialize(d)?;
        Self::new(s).map_err(serde::de::Error::custom)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    #[test]
    fn accepts_plain_alphanumeric_names() {
        assert_eq!(ProfileDirName::parse("demo").unwrap().as_str(), "demo");
        assert_eq!(
            ProfileDirName::parse("production").unwrap().as_str(),
            "production"
        );
        assert_eq!(
            ProfileDirName::parse("profile-1_test").unwrap().as_str(),
            "profile-1_test"
        );
    }

    #[test]
    fn rejects_empty() {
        assert_eq!(ProfileDirName::parse(""), Err(ProfileDirNameError::Empty));
    }

    #[test]
    fn rejects_dot_and_double_dot() {
        assert_eq!(
            ProfileDirName::parse("."),
            Err(ProfileDirNameError::DotOrDotDot)
        );
        assert_eq!(
            ProfileDirName::parse(".."),
            Err(ProfileDirNameError::DotOrDotDot)
        );
    }

    #[test]
    fn rejects_leading_dot() {
        assert_eq!(
            ProfileDirName::parse(".hidden"),
            Err(ProfileDirNameError::LeadingDot)
        );
        assert_eq!(
            ProfileDirName::parse(".ssh"),
            Err(ProfileDirNameError::LeadingDot)
        );
    }

    #[test]
    fn rejects_path_separators() {
        assert_eq!(
            ProfileDirName::parse("a/b"),
            Err(ProfileDirNameError::PathSeparator)
        );
        assert_eq!(
            ProfileDirName::parse("a\\b"),
            Err(ProfileDirNameError::PathSeparator)
        );
    }

    #[test]
    fn rejects_traversal_attempt() {
        // `../etc` trips the leading-dot check before the separator check;
        // both are blockers, either rejection is acceptable.
        assert!(ProfileDirName::parse("../etc").is_err());
        assert!(ProfileDirName::parse("demo/../production").is_err());
    }

    #[test]
    fn rejects_nul() {
        assert_eq!(
            ProfileDirName::parse("demo\0"),
            Err(ProfileDirNameError::InteriorNul)
        );
    }

    #[test]
    fn display_outputs_inner_string() {
        let name = ProfileDirName::parse("demo").unwrap();
        assert_eq!(format!("{name}"), "demo");
    }

    #[test]
    fn serde_accepts_valid_string() {
        let decoded: ProfileDirName = serde_json::from_str("\"demo\"").unwrap();
        assert_eq!(decoded.as_str(), "demo");
    }

    #[test]
    fn serde_rejects_invalid_string() {
        assert!(serde_json::from_str::<ProfileDirName>("\"../etc\"").is_err());
        assert!(serde_json::from_str::<ProfileDirName>("\"\"").is_err());
        assert!(serde_json::from_str::<ProfileDirName>("\".\"").is_err());
    }

    #[test]
    fn serde_roundtrips_as_transparent_string() {
        let name = ProfileDirName::parse("demo").unwrap();
        let json = serde_json::to_string(&name).unwrap();
        assert_eq!(json, "\"demo\"");
        let decoded: ProfileDirName = serde_json::from_str(&json).unwrap();
        assert_eq!(decoded, name);
    }

    #[test]
    fn hashmap_lookup_via_borrow_str_works() {
        let mut map: HashMap<ProfileDirName, i32> = HashMap::new();
        map.insert(ProfileDirName::parse("demo").unwrap(), 42);
        assert_eq!(map.get("demo"), Some(&42));
    }

    #[test]
    fn clone_is_refcount_bump_not_alloc() {
        let a = ProfileDirName::parse("production").unwrap();
        let b = a.clone();
        assert!(std::ptr::eq(a.as_str().as_ptr(), b.as_str().as_ptr()));
    }

    #[test]
    #[should_panic(expected = "ProfileDirName::new_trusted received invalid input")]
    fn new_trusted_panics_on_invalid() {
        let _ = ProfileDirName::new_trusted("../etc");
    }

    #[test]
    fn new_trusted_accepts_valid() {
        let name = ProfileDirName::new_trusted("demo");
        assert_eq!(name.as_str(), "demo");
    }
}
