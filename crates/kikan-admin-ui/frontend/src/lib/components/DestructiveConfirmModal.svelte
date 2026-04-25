<script lang="ts">
  import { Dialog } from "bits-ui";

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

<Dialog.Root bind:open>
  <Dialog.Trigger
    data-testid="destructive-trigger"
    class="rounded bg-destructive px-3 py-2 text-sm font-medium text-destructive-foreground"
  >
    {triggerLabel}
  </Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay class="fixed inset-0 bg-black/40" />
    <Dialog.Content
      class="fixed left-1/2 top-1/2 w-[420px] -translate-x-1/2 -translate-y-1/2 rounded bg-background p-6 shadow-lg"
    >
      <Dialog.Title class="mb-2 text-lg font-semibold">{title}</Dialog.Title>
      <Dialog.Description
        data-testid="destructive-confirm-description"
        class="mb-4 text-sm text-muted-foreground"
      >
        {description}
      </Dialog.Description>

      {#if variant === "T2"}
        <label class="mb-4 block">
          <span class="mb-1 block text-sm font-medium">
            Type the name <code class="rounded bg-muted px-1">{targetName}</code>
            to confirm.
          </span>
          <input
            data-testid="destructive-confirm-name-input"
            type="text"
            placeholder={`Type the name "${targetName}" to confirm`}
            bind:value={typedName}
            class="w-full rounded border border-border px-3 py-2 text-sm"
          />
        </label>
      {/if}

      <div class="flex justify-end gap-2">
        <button
          type="button"
          onclick={handleCancel}
          class="rounded border border-border px-4 py-2 text-sm"
        >
          Cancel
        </button>
        <button
          type="button"
          onclick={handleConfirm}
          disabled={confirmDisabled}
          class="rounded bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground disabled:opacity-50"
        >
          Confirm
        </button>
      </div>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
