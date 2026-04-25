<script lang="ts">
  import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
  } from "$lib/components/ui/tooltip/index.js";
  import { Button } from "$lib/components/ui/button/index.js";
  import HelpCircle from "@lucide/svelte/icons/help-circle";
  import ExternalLink from "@lucide/svelte/icons/external-link";
  import type { BrandingConfig } from "../branding";

  interface Props {
    branding: BrandingConfig;
    runningShops?: number;
  }

  let { branding, runningShops = 1 }: Props = $props();

  let canOpenShop = $derived(runningShops > 0);
  let tooltipMessage = $derived(`No ${branding.shopNounPlural} to open`);
</script>

<header
  data-testid="topbar"
  class="flex h-14 items-center justify-between gap-4 border-b border-border bg-background px-6"
  style:--brand-bg={branding.tokens.bg}
  style:--brand-fg={branding.tokens.fg}
  style:--brand-primary={branding.tokens.primary}
  style:--brand-accent={branding.tokens.accent}
>
  <div class="flex items-center gap-3">
    <span class="text-sm font-semibold text-foreground">Control Plane</span>
    <span
      data-testid="topbar-admin-badge"
      class="rounded bg-primary/10 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary"
    >
      ADMIN
    </span>
    <span class="text-xs text-muted-foreground">
      {branding.appName} · {branding.shopNounPlural}
    </span>
  </div>

  <div class="flex items-center gap-2">
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger>
          {#snippet child({ props })}
            {#if canOpenShop}
              <Button
                type="button"
                variant="outline"
                size="sm"
                data-testid="topbar-open-shop"
                {...props}
              >
                <ExternalLink class="size-4" />
                Open {branding.shopNounSingular}
              </Button>
            {:else}
              <span {...props} class="inline-block">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  data-testid="topbar-open-shop"
                  aria-disabled="true"
                  tabindex={-1}
                  class="cursor-not-allowed opacity-50"
                  onclick={(e) => e.preventDefault()}
                >
                  <ExternalLink class="size-4" />
                  Open {branding.shopNounSingular}
                </Button>
              </span>
            {/if}
          {/snippet}
        </TooltipTrigger>
        {#if !canOpenShop}
          <TooltipContent sideOffset={6} role="tooltip" aria-label={tooltipMessage}>
            {tooltipMessage}
          </TooltipContent>
        {/if}
      </Tooltip>
    </TooltipProvider>

    <Button type="button" variant="outline" size="sm" data-testid="topbar-help">
      <HelpCircle class="size-4" />
      Help
    </Button>
  </div>
</header>
