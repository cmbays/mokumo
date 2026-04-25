<script lang="ts">
  import { FALLBACK_BRANDING } from "$lib/branding";

  // Body-shell stub. The Get Started checklist + 4-region dashboard land in S5.
  // The inline brand-token style satisfies the chrome contract test, which
  // asserts that overview-body carries --brand-* somewhere on its style chain.
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
