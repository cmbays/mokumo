<script lang="ts">
  import { onMount } from "svelte";
  import { goto } from "$app/navigation";
  import { browser } from "$app/environment";
  import { apiFetch } from "$lib/api";
  import { toast } from "$lib/components/toast";
  import Spinner from "$lib/components/spinner.svelte";
  import { Button } from "$lib/components/ui/button";
  import type { SetupStatusResponse } from "$lib/types/SetupStatusResponse";
  import type { ProfileSwitchRequest } from "$lib/types/ProfileSwitchRequest";
  import type { ProfileSwitchResponse } from "$lib/types/ProfileSwitchResponse";
  import RefreshCw from "@lucide/svelte/icons/refresh-cw";

  const MAX_RETRIES = 10;
  const RETRY_DELAY_MS = 500;

  type PageState =
    | { kind: "starting" }
    | { kind: "ready"; productionSetupComplete: boolean }
    | { kind: "error" };

  let pageState = $state<PageState>({ kind: "starting" });
  let switching = $state(false);

  async function fetchSetupStatus(): Promise<SetupStatusResponse | null> {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const result = await apiFetch<SetupStatusResponse>("/api/setup-status");
      if (result.ok && "data" in result) {
        return result.data;
      }
      if (attempt < MAX_RETRIES - 1) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      }
    }
    return null;
  }

  async function checkStatus() {
    pageState = { kind: "starting" };
    const status = await fetchSetupStatus();
    if (!status) {
      pageState = { kind: "error" };
      return;
    }
    // If another session already completed onboarding, leave the welcome screen.
    if (!status.is_first_launch) {
      goto("/");
      return;
    }
    pageState = {
      kind: "ready",
      productionSetupComplete: status.production_setup_complete,
    };
  }

  async function handleSwitch(target: ProfileSwitchRequest["profile"]) {
    switching = true;
    const result = await apiFetch<ProfileSwitchResponse>(
      "/api/profile/switch",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: target,
        } satisfies ProfileSwitchRequest),
      },
    );
    switching = false;

    if (!result.ok) {
      if (result.status === 429) {
        toast.error("Too many attempts — please wait a moment.");
      } else if (result.status === 503) {
        // Production not yet set up — go to setup wizard.
        goto("/setup");
      } else {
        toast.error(result.error.message || "Could not switch profile.");
      }
      return;
    }

    goto("/");
  }

  onMount(() => {
    checkStatus();

    if (browser) {
      const handler = () => checkStatus();
      document.addEventListener("visibilitychange", handler);
      return () => document.removeEventListener("visibilitychange", handler);
    }
  });
</script>

{#if pageState.kind === "starting"}
  <div
    class="flex flex-col items-center gap-3 text-center"
    data-testid="startup-message"
  >
    <Spinner size="lg" />
    <p class="text-sm text-muted-foreground">Starting up...</p>
    <p class="text-xs text-muted-foreground">
      Mokumo is getting ready. This only takes a moment.
    </p>
  </div>
{:else if pageState.kind === "error"}
  <div
    class="flex flex-col items-center gap-4 text-center"
    data-testid="error-state"
  >
    <p class="text-sm font-medium">Could not reach Mokumo</p>
    <p class="text-xs text-muted-foreground">
      The server didn't respond after several attempts.
    </p>
    <Button
      variant="outline"
      size="sm"
      onclick={() => checkStatus()}
      data-testid="refresh-button"
    >
      <RefreshCw class="mr-2 h-4 w-4" />
      Refresh
    </Button>
  </div>
{:else}
  <div class="flex flex-col gap-6">
    <div class="text-center">
      <h1 class="text-xl font-semibold">Welcome to Mokumo</h1>
      <p class="mt-1 text-sm text-muted-foreground">
        How would you like to get started?
      </p>
    </div>

    <div class="flex flex-col gap-3">
      <Button
        class="w-full"
        disabled={switching}
        onclick={() => handleSwitch("production")}
        data-testid="setup-shop-button"
      >
        {#if switching}
          <Spinner size="sm" class="mr-2" />
          Switching...
        {:else}
          Set Up My Shop
        {/if}
      </Button>

      <Button
        variant="outline"
        class="w-full"
        disabled={switching}
        onclick={() => handleSwitch("demo")}
        data-testid="explore-demo-button"
      >
        {#if switching}
          <Spinner size="sm" class="mr-2" />
          Switching...
        {:else}
          Explore Demo
        {/if}
      </Button>
    </div>
  </div>
{/if}
