<script lang="ts">
  import type { Snippet } from "svelte";
  import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
  } from "$lib/components/ui/card/index.js";
  import { Button } from "$lib/components/ui/button/index.js";

  interface Props {
    title: string;
    description: string;
    primaryActionLabel?: string;
    onPrimaryAction?: () => void | Promise<void>;
    icon?: Snippet;
  }

  let { title, description, primaryActionLabel, onPrimaryAction, icon }: Props = $props();
</script>

<Card data-testid="empty-state" class="border-dashed text-center">
  <CardHeader class="items-center">
    {#if icon}
      <span class="text-muted-foreground">{@render icon()}</span>
    {/if}
    <CardTitle class="text-lg">{title}</CardTitle>
    <CardDescription class="max-w-md">{description}</CardDescription>
  </CardHeader>
  {#if primaryActionLabel && onPrimaryAction}
    <CardContent class="flex justify-center">
      <Button type="button" onclick={onPrimaryAction}>{primaryActionLabel}</Button>
    </CardContent>
  {/if}
</Card>
