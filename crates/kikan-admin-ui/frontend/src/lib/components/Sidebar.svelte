<script lang="ts">
  import { base } from "$app/paths";
  import { navEntries, isActive } from "../nav";
  import type { BrandingConfig } from "../branding";

  interface Props {
    currentPath: string;
    branding: BrandingConfig;
    activeProfileName?: string;
    otherProfileNames?: string[];
  }

  let {
    currentPath,
    branding,
    activeProfileName = "Default",
    otherProfileNames = [],
  }: Props = $props();

  let topEntries = $derived(navEntries.filter((e) => e.group === "TOP"));
  let profileEntries = $derived(navEntries.filter((e) => e.group === "PROFILE"));
</script>

<aside
  data-testid="sidebar-nav"
  class="flex h-full w-60 flex-col border-r border-border bg-muted/20 p-3"
  style:--brand-bg={branding.tokens.bg}
  style:--brand-fg={branding.tokens.fg}
  style:--brand-primary={branding.tokens.primary}
  style:--brand-accent={branding.tokens.accent}
>
  <div class="mb-4 px-2 py-3">
    <span class="text-base font-semibold text-foreground">{branding.appName}</span>
  </div>

  <nav class="flex flex-col gap-1">
    {#each topEntries as entry (entry.id)}
      {@const href = `${base}${entry.path}`}
      {@const active = isActive(currentPath, entry, base)}
      <a
        {href}
        data-nav-entry
        data-nav-id={entry.id}
        data-nav-label={entry.label}
        data-nav-group={entry.group}
        data-active={active ? "true" : "false"}
        class="flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
        class:bg-accent={active}
        class:font-medium={active}
      >
        <entry.icon class="size-4" />
        <span>{entry.label}</span>
      </a>
    {/each}
  </nav>

  <div data-testid="sidebar-profile-divider" class="mb-2 mt-6 flex items-center gap-2 px-3">
    <span class="text-xs font-semibold tracking-widest text-muted-foreground">PROFILE</span>
    <hr class="flex-1 border-t border-border" />
  </div>

  <div data-testid="sidebar-profile-switcher" class="px-3 py-2">
    <div class="flex flex-col gap-1">
      <span class="text-xs uppercase tracking-wide text-muted-foreground">
        Active {branding.shopNounSingular}
      </span>
      <button
        type="button"
        class="rounded bg-accent px-3 py-2 text-left text-sm font-medium"
        data-profile-state="active"
      >
        {activeProfileName}
      </button>
      {#each otherProfileNames as name (name)}
        <button
          type="button"
          class="rounded px-3 py-2 text-left text-sm text-muted-foreground"
          data-profile-state="inactive"
        >
          {name}
        </button>
      {/each}
    </div>
  </div>

  <nav class="mt-1 flex flex-col gap-1">
    {#each profileEntries as entry (entry.id)}
      {@const href = `${base}${entry.path}`}
      {@const active = isActive(currentPath, entry, base)}
      <a
        {href}
        data-nav-entry
        data-nav-id={entry.id}
        data-nav-label={entry.label}
        data-nav-group={entry.group}
        data-active={active ? "true" : "false"}
        class="flex items-center gap-2 rounded px-3 py-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
        class:bg-accent={active}
        class:font-medium={active}
      >
        <entry.icon class="size-4" />
        <span>{entry.label}</span>
      </a>
    {/each}
  </nav>
</aside>
