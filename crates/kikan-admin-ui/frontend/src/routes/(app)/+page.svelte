<script lang="ts">
  import { applyTokensToRoot, FALLBACK_BRANDING } from "$lib/branding";
  import { onMount } from "svelte";

  // Body-shell stub. The Get Started checklist + 4-region dashboard land in S5.
  // The data-testid below is what the branding-token chrome contract test checks.
  onMount(() => {
    applyTokensToRoot(FALLBACK_BRANDING.tokens);
  });
</script>

<section
  data-testid="overview-body"
  class="p-8"
  style:--brand-bg={FALLBACK_BRANDING.tokens.bg}
  style:--brand-fg={FALLBACK_BRANDING.tokens.fg}
  style:--brand-primary={FALLBACK_BRANDING.tokens.primary}
  style:--brand-accent={FALLBACK_BRANDING.tokens.accent}
>
  <h1 class="text-2xl font-semibold">Overview</h1>
  <p class="mt-2 text-sm text-muted-foreground">
    Dashboard regions and Get Started checklist arrive in the next session.
  </p>
</section>
