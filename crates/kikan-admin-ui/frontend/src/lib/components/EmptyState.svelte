<script lang="ts">
  import type { Snippet } from "svelte";

  interface Props {
    title: string;
    description: string;
    primaryActionLabel?: string;
    onPrimaryAction?: () => void | Promise<void>;
    icon?: Snippet;
  }

  let { title, description, primaryActionLabel, onPrimaryAction, icon }: Props = $props();
</script>

<div
  data-testid="empty-state"
  class="flex flex-col items-center gap-3 rounded border border-dashed border-muted-foreground/30 bg-muted/30 p-12 text-center"
>
  {#if icon}
    <span class="text-muted-foreground">{@render icon()}</span>
  {/if}
  <h2 class="text-lg font-semibold">{title}</h2>
  <p class="max-w-md text-sm text-muted-foreground">{description}</p>
  {#if primaryActionLabel && onPrimaryAction}
    <button
      type="button"
      onclick={onPrimaryAction}
      class="mt-3 rounded bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
    >
      {primaryActionLabel}
    </button>
  {/if}
</div>
