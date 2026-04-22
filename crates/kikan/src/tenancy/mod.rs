pub mod guards;
pub mod layout;
mod profile_dir_name;
mod profile_id;
pub mod resolve;

pub use profile_dir_name::ProfileDirName;
pub use profile_id::{ProfileId, SetupMode};

use parking_lot::RwLock;
use sea_orm::DatabaseConnection;
use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::Arc;

use crate::error::TenancyError;

pub struct Tenancy {
    pools: Arc<RwLock<HashMap<ProfileId, DatabaseConnection>>>,
    data_dir: PathBuf,
}

impl Tenancy {
    pub fn new(data_dir: PathBuf) -> Self {
        Self {
            pools: Arc::new(RwLock::new(HashMap::new())),
            data_dir,
        }
    }

    pub fn for_profile(&self, id: &ProfileId) -> Result<DatabaseConnection, TenancyError> {
        self.pools
            .read()
            .get(id)
            .cloned()
            .ok_or_else(|| TenancyError::ProfileNotFound {
                profile: id.to_string(),
            })
    }

    pub fn db_paths(&self) -> Vec<PathBuf> {
        let pools = self.pools.read();
        pools
            .keys()
            .map(|id| self.data_dir.join(format!("{id}.db")))
            .collect()
    }

    pub fn data_dir(&self) -> &Path {
        &self.data_dir
    }

    #[allow(dead_code)]
    pub(crate) fn register_pool(&self, id: ProfileId, conn: DatabaseConnection) {
        self.pools.write().insert(id, conn);
    }
}

impl std::fmt::Debug for Tenancy {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("Tenancy")
            .field("data_dir", &self.data_dir)
            .field("pool_count", &self.pools.read().len())
            .finish()
    }
}
