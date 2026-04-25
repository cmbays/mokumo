<script lang="ts">
  import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
  } from "$lib/components/ui/dialog/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import { Input } from "$lib/components/ui/input/index.js";
  import { Label } from "$lib/components/ui/label/index.js";

  type Variant = "T1" | "T2";

  interface Props {
    variant: Variant;
    description: string;
    targetName?: string;
    triggerLabel?: string;
    onConfirm?: () => void | Promise<void>;
  }

  let {
    variant,
    description,
    targetName = "",
    triggerLabel = "Delete",
    onConfirm,
  }: Props = $props();

  let open = $state(false);
  let typedName = $state("");

  let confirmDisabled = $derived(variant === "T2" && typedName !== targetName);

  let title = $derived(
    variant === "T2" ? `Confirm deletion of ${targetName}` : "Confirm this action",
  );

  function reset(): void {
    typedName = "";
  }

  async function handleConfirm(): Promise<void> {
    if (confirmDisabled) return;
    if (onConfirm) await onConfirm();
    open = false;
    reset();
  }

  function handleCancel(): void {
    open = false;
    reset();
  }
</script>

<Dialog bind:open>
  <DialogTrigger>
    {#snippet child({ props })}
      <Button
        type="button"
        variant="destructive"
        data-testid="destructive-trigger"
        {...props}
      >
        {triggerLabel}
      </Button>
    {/snippet}
  </DialogTrigger>
  <DialogContent class="sm:max-w-md">
    <DialogHeader>
      <DialogTitle>{title}</DialogTitle>
      <DialogDescription data-testid="destructive-confirm-description">
        {description}
      </DialogDescription>
    </DialogHeader>

    {#if variant === "T2"}
      <div class="grid gap-2">
        <Label for="destructive-confirm-name-input">
          Type the name <code class="rounded bg-muted px-1">{targetName}</code> to confirm.
        </Label>
        <Input
          id="destructive-confirm-name-input"
          data-testid="destructive-confirm-name-input"
          type="text"
          placeholder={`Type the name "${targetName}" to confirm`}
          bind:value={typedName}
        />
      </div>
    {/if}

    <DialogFooter>
      <Button type="button" variant="outline" onclick={handleCancel}>Cancel</Button>
      <Button type="button" variant="destructive" disabled={confirmDisabled} onclick={handleConfirm}>
        Confirm
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
