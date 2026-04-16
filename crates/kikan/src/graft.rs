use crate::error::EngineError;
use crate::migrations::bootstrap::BootstrapMigrations;
use crate::migrations::{GraftId, Migration};
use crate::tenancy::Tenancy;

#[trait_variant::make(Send)]
pub trait Graft: Sized + 'static {
    type AppState: Clone + Send + Sync + 'static;

    fn id() -> GraftId;
    fn migrations(&self) -> Vec<Box<dyn Migration>>;
    async fn build_state(&self, tenancy: &Tenancy) -> Result<Self::AppState, EngineError>;
    async fn run(&self, state: Self::AppState) -> Result<(), EngineError>;
}

#[async_trait::async_trait]
pub trait SubGraft: Send + Sync + 'static {
    fn id(&self) -> GraftId;
    fn migrations(&self) -> Vec<Box<dyn Migration>>;

    async fn on_ignite(&self) -> Result<(), EngineError> {
        Ok(())
    }
    async fn on_liftoff(&self) -> Result<(), EngineError> {
        Ok(())
    }
    async fn on_shutdown(&self) -> Result<(), EngineError> {
        Ok(())
    }
    async fn check(&self) -> Result<(), EngineError> {
        Ok(())
    }
}

pub struct SelfGraft;

#[async_trait::async_trait]
impl SubGraft for SelfGraft {
    fn id(&self) -> GraftId {
        BootstrapMigrations::graft_id()
    }

    fn migrations(&self) -> Vec<Box<dyn Migration>> {
        BootstrapMigrations::migrations()
    }
}
