<script lang="ts">
  import { onMount } from "svelte";
  import { apiFetch } from "$lib/api";
  import type { HealthResponse } from "$lib/types/HealthResponse";
  import type { ServerInfoResponse } from "$lib/types/ServerInfoResponse";
  import * as Card from "$lib/components/ui/card";
  import CopyableUrl from "$lib/components/copyable-url.svelte";
  import { page } from "$app/state";
  import { profile } from "$lib/stores/profile.svelte";
  import { Button } from "$lib/components/ui/button";

  let healthy = $state<boolean | null>(null);
  let version = $state("");
  let serverInfo = $state<ServerInfoResponse | null>(null);

  let displayUrl = $derived(serverInfo?.lan_url ?? serverInfo?.ip_url ?? null);

  onMount(async () => {
    const [healthResult, infoResult] = await Promise.all([
      apiFetch<HealthResponse>("/api/health"),
      apiFetch<ServerInfoResponse>("/api/server-info"),
    ]);

    if (healthResult.ok && "data" in healthResult) {
      healthy = true;
      version = healthResult.data.version;
    } else {
      healthy = false;
    }

    if (infoResult.ok && "data" in infoResult) {
      serverInfo = infoResult.data;
    } else {
      console.error("Failed to fetch server info");
    }
  });
</script>

<div class="space-y-6">
  <div>
    <h1 class="text-2xl font-bold">{page.data.shop_name ?? "Your Shop"}</h1>
    <p class="text-sm text-muted-foreground">Powered by Mokumo</p>
  </div>

  <div class="grid gap-4 md:grid-cols-2">
    <Card.Card>
      <Card.CardHeader class="pb-2">
        <Card.CardTitle class="text-sm font-medium"
          >Server Status</Card.CardTitle
        >
      </Card.CardHeader>
      <Card.CardContent>
        <div class="flex items-center gap-2">
          {#if healthy === null}
            <div class="size-2.5 rounded-full bg-muted animate-pulse"></div>
            <span class="text-sm text-muted-foreground">Checking...</span>
          {:else if healthy}
            <div class="size-2.5 rounded-full bg-status-success"></div>
            <span class="text-sm">Online</span>
          {:else}
            <div class="size-2.5 rounded-full bg-status-error"></div>
            <span class="text-sm">Offline</span>
          {/if}
        </div>
      </Card.CardContent>
    </Card.Card>

    <Card.Card>
      <Card.CardHeader class="pb-2">
        <Card.CardTitle class="text-sm font-medium">Version</Card.CardTitle>
      </Card.CardHeader>
      <Card.CardContent>
        <p class="text-sm">{version || "—"}</p>
      </Card.CardContent>
    </Card.Card>
  </div>

  {#if displayUrl}
    <Card.Card>
      <Card.CardHeader>
        <Card.CardTitle>Connect Your Team</Card.CardTitle>
        <Card.CardDescription>
          Share this with your team — they can open it in any browser on your
          shop WiFi.
        </Card.CardDescription>
      </Card.CardHeader>
      <Card.CardContent>
        <CopyableUrl
          url={displayUrl}
          label="Copy team URL to clipboard"
          testId="copy-team-url"
        />
      </Card.CardContent>
    </Card.Card>
  {/if}

  {#if page.data.setup_mode === "demo"}
    <Card.Card>
      <Card.CardHeader>
        <Card.CardTitle>Getting Started</Card.CardTitle>
        <Card.CardDescription>Explore what Mokumo can do</Card.CardDescription>
      </Card.CardHeader>
      <Card.CardContent>
        {#if page.data.production_setup_complete}
          <p class="text-sm text-muted-foreground">
            You're exploring demo data.
          </p>
          <Button
            variant="outline"
            class="mt-3"
            onclick={() => (profile.openProfileSwitcher = true)}
          >
            Switch to My Shop
          </Button>
        {:else}
          <a href="/customers" class="text-sm text-primary hover:underline">
            Explore sample customers &rarr;
          </a>
        {/if}
      </Card.CardContent>
    </Card.Card>
  {:else}
    <Card.Card>
      <Card.CardHeader>
        <Card.CardTitle>Getting Started</Card.CardTitle>
        <Card.CardDescription>Start building your shop</Card.CardDescription>
      </Card.CardHeader>
      <Card.CardContent>
        <a href="/customers" class="text-sm text-primary hover:underline">
          Create your first customer &rarr;
        </a>
      </Card.CardContent>
    </Card.Card>
  {/if}
</div>
