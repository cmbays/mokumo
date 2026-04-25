<script lang="ts">
  import { onMount, onDestroy } from "svelte";

  interface Props {
    nextRetryInSeconds: number;
  }

  let { nextRetryInSeconds = 5 }: Props = $props();

  let displayMs = $state(nextRetryInSeconds * 1000);
  let interval: ReturnType<typeof setInterval> | undefined;

  onMount(() => {
    interval = setInterval(() => {
      displayMs = Math.max(0, displayMs - 100);
      if (displayMs === 0) {
        displayMs = nextRetryInSeconds * 1000;
      }
    }, 100);
  });

  onDestroy(() => {
    if (interval) clearInterval(interval);
  });

  let countdownText = $derived(`${(displayMs / 1000).toFixed(1)}s`);
</script>

<div
  data-testid="self-healing-banner"
  role="status"
  aria-live="polite"
  class="flex items-center justify-between gap-4 rounded bg-amber-100 px-4 py-2 text-sm text-amber-900"
>
  <span>Connection lost. Retrying automatically — next attempt in <span data-testid="self-healing-banner-next-retry">{countdownText}</span>.</span>
</div>
