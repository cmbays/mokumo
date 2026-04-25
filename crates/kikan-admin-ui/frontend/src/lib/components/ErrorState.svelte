<script lang="ts">
  interface Props {
    title?: string;
    description?: string;
    onRetry?: () => void | Promise<void>;
  }

  let {
    title = "Something went wrong",
    description = "The request failed. Try again, or check Diagnostics if the problem persists.",
    onRetry,
  }: Props = $props();

  let retrying = $state(false);

  async function handleRetry(): Promise<void> {
    if (!onRetry || retrying) return;
    retrying = true;
    try {
      await onRetry();
    } finally {
      retrying = false;
    }
  }
</script>

<div
  data-testid="error-state"
  role="alert"
  class="flex flex-col items-start gap-3 rounded border border-destructive/30 bg-destructive/5 p-6"
>
  <h2 class="text-lg font-semibold">{title}</h2>
  <p class="text-sm text-muted-foreground">{description}</p>
  {#if onRetry}
    <button
      type="button"
      onclick={handleRetry}
      disabled={retrying}
      class="rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
    >
      Try again
    </button>
  {/if}
</div>
