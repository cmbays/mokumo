// Re-export from domain layer — canonical source lives in domain/lib/design-system.ts
// Outer layers (shared, features, app) import from here. Domain layer imports directly.
export {
  statusBadge,
  categoryBadge,
  dotColor,
  textToBgColor,
  MUTED_BADGE,
  type StatusRole,
  type CategoryColor,
} from '@domain/lib/design-system'
