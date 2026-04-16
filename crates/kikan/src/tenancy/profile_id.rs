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

#[derive(Debug, Clone, PartialEq, Eq, Hash)]
pub struct ProfileId(SetupMode);

impl ProfileId {
    pub fn new(mode: SetupMode) -> Self {
        Self(mode)
    }

    pub fn get(&self) -> SetupMode {
        self.0
    }
}

impl From<SetupMode> for ProfileId {
    fn from(mode: SetupMode) -> Self {
        Self(mode)
    }
}

impl fmt::Display for ProfileId {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        write!(f, "{}", self.0)
    }
}
