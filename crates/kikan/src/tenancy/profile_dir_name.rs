//! `ProfileDirName`: opaque newtype for the on-disk directory name of a
//! profile.
//!
//! Kikan stores per-profile resources (database pool, recovery files,
//! etc.) keyed by a String obtained from `Graft::profile_dir_name(&kind)`.
//! Using a raw `String` at the API boundary invites mixing up a profile
//! name with any other string (username, email, password). `ProfileDirName`
//! wraps an `Arc<str>` so: (a) clone is a refcount bump — no allocation;
//! (b) callers can't accidentally pass an unrelated string where a
//! profile directory is expected.
//!
//! The wrapped value must always be the output of
//! `Graft::profile_dir_name(&kind)`. Kikan never inspects the string
//! itself — it only uses it as a HashMap key, a `Display` target, and a
//! serde field. Mokumo owns the string values via its Graft impl.

use std::sync::Arc;

/// Opaque directory-name key for a profile, sourced from
/// `Graft::profile_dir_name(&kind)`. Kikan never matches on its contents
/// — only stores/compares/displays it.
#[derive(Clone, Debug, PartialEq, Eq, Hash, serde::Serialize, serde::Deserialize)]
#[serde(transparent)]
pub struct ProfileDirName(Arc<str>);

impl ProfileDirName {
    /// Construct a `ProfileDirName` from any string-like value.
    pub fn new(name: impl Into<Arc<str>>) -> Self {
        Self(name.into())
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

impl From<&'static str> for ProfileDirName {
    fn from(s: &'static str) -> Self {
        Self(Arc::from(s))
    }
}

impl From<String> for ProfileDirName {
    fn from(s: String) -> Self {
        Self(Arc::from(s))
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    #[test]
    fn constructs_from_str_literal() {
        let name = ProfileDirName::from("demo");
        assert_eq!(name.as_str(), "demo");
    }

    #[test]
    fn constructs_from_owned_string() {
        let name = ProfileDirName::from(String::from("production"));
        assert_eq!(name.as_str(), "production");
    }

    #[test]
    fn display_outputs_inner_string() {
        let name = ProfileDirName::from("demo");
        assert_eq!(format!("{name}"), "demo");
    }

    #[test]
    fn serde_roundtrips_as_transparent_string() {
        let name = ProfileDirName::from("demo");
        let json = serde_json::to_string(&name).unwrap();
        assert_eq!(json, "\"demo\"");
        let decoded: ProfileDirName = serde_json::from_str(&json).unwrap();
        assert_eq!(decoded, name);
    }

    #[test]
    fn hashmap_lookup_via_borrow_str_works() {
        // Borrow<str> lets callers look up with &str without constructing
        // a throwaway ProfileDirName for the lookup.
        let mut map: HashMap<ProfileDirName, i32> = HashMap::new();
        map.insert(ProfileDirName::from("demo"), 42);
        assert_eq!(map.get("demo"), Some(&42));
    }

    #[test]
    fn clone_is_refcount_bump_not_alloc() {
        let a = ProfileDirName::from("production");
        let b = a.clone();
        // Pointer equality on the inner Arc<str> proves clone didn't allocate.
        assert!(std::ptr::eq(a.as_str().as_ptr(), b.as_str().as_ptr()));
    }
}
