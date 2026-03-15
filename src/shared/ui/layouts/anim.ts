/**
 * Shared easing constants for sidebar layout animations.
 *
 * Two curves cover all motion in the sidebar system:
 *   EASE_STANDARD  — Material-like ease-in-out for structural/layout transitions (width, position)
 *   EASE_BOUNCE    — Springy overshoot for interactive feedback (active indicator, icon scale, icon transforms)
 */
export const EASE_STANDARD = 'cubic-bezier(0.4, 0, 0.2, 1)'
export const EASE_BOUNCE = 'cubic-bezier(0.34, 1.56, 0.64, 1)'
