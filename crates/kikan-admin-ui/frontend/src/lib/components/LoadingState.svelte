<script lang="ts">
  import { Skeleton } from "$lib/components/ui/skeleton/index.js";

  interface Props {
    label?: string;
    regions?: number;
  }

  let { label = "Loading…", regions = 3 }: Props = $props();
</script>

<div
  data-testid="loading-skeleton"
  aria-busy="true"
  aria-live="polite"
  class="flex flex-col gap-3 p-6"
>
  <span class="sr-only">{label}</span>
  {#each Array(regions) as _, i (i)}
    <Skeleton
      data-skeleton-region
      class="h-4"
      style="width: {i === 0 ? '60%' : i === regions - 1 ? '40%' : '100%'}"
    />
  {/each}
</div>
