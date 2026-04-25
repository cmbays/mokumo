<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { page } from "$app/state";
  import Sidebar from "$lib/components/Sidebar.svelte";
  import Topbar from "$lib/components/Topbar.svelte";
  import { applyTokensToRoot, FALLBACK_BRANDING, loadBranding, type BrandingConfig } from "$lib/branding";
  import { fetchPlatform } from "$lib/platform";

  let { children } = $props();

  let branding = $state<BrandingConfig>(FALLBACK_BRANDING);
  let runningShops = $state(1);
  let appMetaTimer: ReturnType<typeof setInterval> | undefined;

  async function refreshAppMeta(): Promise<void> {
    try {
      const meta = await fetchPlatform<{ running_shops: number }>("/app-meta");
      runningShops = meta.running_shops;
    } catch {
      // Leave the previous value; the chrome still renders.
    }
  }

  onMount(() => {
    void loadBranding().then((b) => {
      branding = b;
      applyTokensToRoot(b.tokens);
    });
    void refreshAppMeta();
    appMetaTimer = setInterval(refreshAppMeta, 1500);
  });

  onDestroy(() => {
    if (appMetaTimer) clearInterval(appMetaTimer);
  });
</script>

<div class="flex h-full min-h-screen w-full">
  <Sidebar currentPath={page.url.pathname} {branding} />

  <div class="flex flex-1 flex-col">
    <Topbar {branding} {runningShops} />
    <main class="flex-1 overflow-auto bg-background">
      {@render children()}
    </main>
  </div>
</div>
