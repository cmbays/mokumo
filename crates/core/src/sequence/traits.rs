use super::FormattedSequence;
use crate::error::DomainError;

/// Port for atomic sequence number generation.
///
/// Implementors must guarantee that concurrent calls never produce
/// duplicate values for the same sequence name.
#[allow(async_fn_in_trait)] // All impls are Send; single-binary app with no external consumers.
pub trait SequenceGenerator: Send + Sync {
    async fn next_value(&self, sequence_name: &str) -> Result<FormattedSequence, DomainError>;
}
