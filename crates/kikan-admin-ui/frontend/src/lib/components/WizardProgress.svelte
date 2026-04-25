<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
  import { cn } from "$lib/utils.js";

  export interface WizardStep {
    id: string;
    label: string;
  }

  interface Props {
    steps: WizardStep[];
    currentId: string;
    testId: string;
    /** data-testid prefix for clickable step buttons (e.g. "wizard-step"). */
    stepTestidPrefix: string;
    onSelect?: (id: string) => void;
  }

  let { steps, currentId, testId, stepTestidPrefix, onSelect }: Props = $props();
</script>

<ol data-testid={testId} class="flex items-center gap-2">
  {#each steps as step, i (step.id)}
    {@const active = step.id === currentId}
    <li data-step data-step-id={step.id} class="flex items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        data-testid="{stepTestidPrefix}-{step.id}"
        data-active={active ? "true" : "false"}
        onclick={() => onSelect?.(step.id)}
        class={cn("gap-2", active ? "font-semibold text-primary" : "text-muted-foreground")}
      >
        <span
          class={cn(
            "flex h-6 w-6 items-center justify-center rounded-full border text-xs",
            active
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border",
          )}
        >
          {i + 1}
        </span>
        <span>{step.label}</span>
      </Button>
      {#if i < steps.length - 1}
        <span aria-hidden="true" class="h-px w-6 bg-border"></span>
      {/if}
    </li>
  {/each}
</ol>
