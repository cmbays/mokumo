<script lang="ts">
  import { page } from "$app/state";
  import LoadingState from "$lib/components/LoadingState.svelte";
  import ErrorState from "$lib/components/ErrorState.svelte";
  import EmptyState from "$lib/components/EmptyState.svelte";
  import ConnectionMonitor from "$lib/components/ConnectionMonitor.svelte";
  import SelfHealingBanner from "$lib/components/SelfHealingBanner.svelte";
  import DestructiveConfirmModal from "$lib/components/DestructiveConfirmModal.svelte";

  // Test-only harness: dispatches on `?mode=...` to render shared components
  // in isolation so BDD scenarios can pin component contracts without the
  // owning screen having to exist yet.

  let mode = $derived(page.url.searchParams.get("mode") ?? "");
  let target = $derived(page.url.searchParams.get("target") ?? "kiln-room");

  async function retryProbe(): Promise<void> {
    try {
      await fetch("/api/platform/v1/branding", { cache: "no-store" });
    } catch {
      // The harness only needs the request to fire; retry counter lives in the test.
    }
  }
</script>

<section data-testid="overview-body" class="p-8">
  {#if mode === "loading"}
    <LoadingState regions={4} />
  {:else if mode === "error-5xx"}
    <ErrorState onRetry={retryProbe} />
  {:else if mode === "empty-list"}
    <EmptyState
      title="No items yet"
      description="Items you create will appear here once you add your first one."
      primaryActionLabel="Create item"
      onPrimaryAction={() => {}}
    />
  {:else if mode === "online"}
    <ConnectionMonitor pollIntervalMs={300} />
    <p class="text-sm text-muted-foreground">Idle screen — connection monitor running.</p>
  {:else if mode === "banner-visible"}
    <ConnectionMonitor
      pollIntervalMs={300}
      initiallyOffline={true}
      firstProbeDelayMs={2400}
    />
    <p class="text-sm text-muted-foreground">Banner visible while monitor is offline.</p>
  {:else if mode === "confirm-t1"}
    <DestructiveConfirmModal
      variant="T1"
      description="This will disconnect the integration. You can reconnect from the Integrations list at any time."
      triggerLabel="Disconnect"
    />
  {:else if mode === "confirm-t2"}
    <DestructiveConfirmModal
      variant="T2"
      targetName={target}
      description="This permanently deletes the {target} profile and its data. This action cannot be undone."
      triggerLabel="Delete"
    />
  {:else}
    <p class="text-sm text-muted-foreground">BDD harness — pass <code>?mode=</code>.</p>
  {/if}
</section>
