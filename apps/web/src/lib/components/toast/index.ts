import { toast, Toaster } from "svelte-sonner";

/**
 * OKLCH-based toast classes for unstyled svelte-sonner.
 * The `toast` key provides base layout since `unstyled: true` strips all defaults.
 * Uses border-emphasis + foreground text for cross-theme legibility.
 */
export const toastClasses = {
  toast:
    "flex items-center gap-2 rounded-lg px-4 py-3 shadow-lg border bg-background text-foreground",
  success: "border-success bg-success/10 text-foreground",
  error: "border-error bg-error/10 text-foreground",
  warning: "border-warning bg-warning/10 text-foreground",
  info: "border-border bg-muted text-foreground",
};

export { toast, Toaster };
