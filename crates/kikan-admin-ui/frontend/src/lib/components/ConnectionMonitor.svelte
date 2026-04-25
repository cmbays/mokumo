<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import SelfHealingBanner from "./SelfHealingBanner.svelte";

  interface Props {
    pollIntervalMs?: number;
    nextRetryInSeconds?: number;
    initiallyOffline?: boolean;
    firstProbeDelayMs?: number;
  }

  let {
    pollIntervalMs = 400,
    nextRetryInSeconds = 5,
    initiallyOffline = false,
    firstProbeDelayMs = 0,
  }: Props = $props();

  let online = $state(!initiallyOffline);
  let timer: ReturnType<typeof setInterval> | undefined;
  let startup: ReturnType<typeof setTimeout> | undefined;

  async function probe(): Promise<void> {
    try {
      await fetch("/api/platform/v1/branding", { cache: "no-store" });
      online = true;
    } catch {
      online = false;
    }
  }

  onMount(() => {
    startup = setTimeout(() => {
      void probe();
      timer = setInterval(probe, pollIntervalMs);
    }, firstProbeDelayMs);
  });

  onDestroy(() => {
    if (timer) clearInterval(timer);
    if (startup) clearTimeout(startup);
  });
</script>

{#if !online}
  <SelfHealingBanner {nextRetryInSeconds} />
{/if}
