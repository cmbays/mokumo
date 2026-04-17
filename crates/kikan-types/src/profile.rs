//! Profile / setup-mode wire types.
//!
//! `SetupMode` is the demo-vs-production enum used by both the platform core
//! (`kikan::tenancy`) and API wire types (setup, diagnostics). Lives in
//! `kikan-types` so `kikan-types` does not depend on `kikan` — lets kikan
//! depend on kikan-types for error types without introducing a cycle.

use serde::{Deserialize, Serialize};
use std::fmt;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum SetupMode {
    Demo,
    Production,
}

impl SetupMode {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Demo => "demo",
            Self::Production => "production",
        }
    }

    pub fn as_dir_name(&self) -> &'static str {
        self.as_str()
    }
}

impl fmt::Display for SetupMode {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            Self::Demo => write!(f, "demo"),
            Self::Production => write!(f, "production"),
        }
    }
}

impl std::str::FromStr for SetupMode {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.trim().to_lowercase().as_str() {
            "demo" => Ok(Self::Demo),
            "production" => Ok(Self::Production),
            other => Err(format!("unknown setup mode: {other}")),
        }
    }
}
