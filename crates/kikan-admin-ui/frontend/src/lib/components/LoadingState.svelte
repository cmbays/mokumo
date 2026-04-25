<script lang="ts">
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
    <div
      data-skeleton-region
      class="h-4 w-full animate-pulse rounded bg-muted"
      style:width={i === 0 ? "60%" : i === regions - 1 ? "40%" : "100%"}
    ></div>
  {/each}
</div>
