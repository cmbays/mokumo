use std::fmt;

// SetupMode lives in `kikan-types` so `kikan-types` does not depend on
// `kikan` — necessary for `kikan` to depend on `kikan-types` (for the
// `AppError`/`ErrorCode` types lifted in S4.0) without a dependency cycle.
pub use kikan_types::SetupMode;

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
