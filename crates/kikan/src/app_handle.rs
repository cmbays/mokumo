use crate::error::AppHandleError;
use std::path::PathBuf;

pub trait AppHandleShim: Send + Sync + 'static {
    fn data_dir(&self) -> Result<PathBuf, AppHandleError>;
    fn app_version(&self) -> &str;
    fn emit_event(&self, event: &str, payload: serde_json::Value);
}
