<script lang="ts">
  import { Alert, AlertDescription, AlertTitle } from "$lib/components/ui/alert/index.js";
  import { Button } from "$lib/components/ui/button/index.js";

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

<Alert data-testid="error-state" variant="destructive" class="flex flex-col items-start gap-3">
  <AlertTitle class="text-lg font-semibold">{title}</AlertTitle>
  <AlertDescription>{description}</AlertDescription>
  {#if onRetry}
    <Button type="button" variant="default" onclick={handleRetry} disabled={retrying}>
      Try again
    </Button>
  {/if}
</Alert>
