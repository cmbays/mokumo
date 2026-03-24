use super::FormattedSequence;
use crate::error::DomainError;

/// Port for atomic sequence number generation.
///
/// Implementors must guarantee that concurrent calls never produce
/// duplicate values for the same sequence name.
///
/// Uses `async fn` in trait (RPITIT). Dyn-incompatible by design —
/// impls are wired via concrete types or generics (static dispatch).
/// If dynamic dispatch is needed, migrate to `Pin<Box<dyn Future>>`.
#[allow(async_fn_in_trait)]
pub trait SequenceGenerator: Send + Sync {
    async fn next_value(&self, sequence_name: &str) -> Result<FormattedSequence, DomainError>;
}
