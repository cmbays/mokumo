<script lang="ts">
  interface Props {
    nextRetryInSeconds?: number;
  }

  let { nextRetryInSeconds = 5 }: Props = $props();

  let displayMs = $state(0);
  let countdownText = $derived(`${(displayMs / 1000).toFixed(1)}s`);

  // Reading nextRetryInSeconds inside the effect makes the timer reset if
  // the parent changes the cadence after mount.
  $effect(() => {
    const totalMs = nextRetryInSeconds * 1000;
    displayMs = totalMs;
    const interval = setInterval(() => {
      displayMs = displayMs <= 100 ? totalMs : displayMs - 100;
    }, 100);
    return () => clearInterval(interval);
  });
</script>

<div
  data-testid="self-healing-banner"
  role="status"
  aria-live="polite"
  class="flex items-center justify-between gap-4 rounded bg-amber-100 px-4 py-2 text-sm text-amber-900"
>
  <span
    >Connection lost. Retrying automatically — next attempt in
    <span data-testid="self-healing-banner-next-retry">{countdownText}</span>.</span
  >
</div>
