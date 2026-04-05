<script lang="ts">
  import "../app.css";
  import { ModeWatcher, mode } from "mode-watcher";
  import { Toaster, toastClasses } from "$lib/components/toast";
  import { toast } from "svelte-sonner";
  import { onMount } from "svelte";
  import type { ServerStartupError } from "$lib/types/ServerStartupError";

  let { children } = $props();

  onMount(() => {
    if (!("__TAURI_INTERNALS__" in window)) return;

    let unlisten: (() => void) | undefined;

    import("@tauri-apps/api/event").then(({ listen }) => {
      listen<ServerStartupError>("server-error", ({ payload }) => {
        toast.error("Server failed to restart", {
          description: formatStartupError(payload),
          duration: Infinity,
        });
      }).then((fn) => {
        unlisten = fn;
      });
    });

    return () => {
      unlisten?.();
    };
  });

  function formatStartupError(err: ServerStartupError): string {
    if (err.code === "migration_failed") {
      return `Migration failed (${err.path}): ${err.message}`;
    }
    if (err.code === "schema_incompatible") {
      return `Database is newer than this version of Mokumo (${err.path}). Upgrade Mokumo or restore from backup.`;
    }
    return `File at ${err.path} is not a Mokumo database. Check your data directory.`;
  }
</script>

<ModeWatcher defaultMode="system" />
<Toaster
  closeButton
  theme={mode.current}
  toastOptions={{ unstyled: true, classes: toastClasses }}
/>
{@render children()}
