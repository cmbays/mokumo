<script lang="ts">
  import { beforeNavigate, goto } from "$app/navigation";
  import UnsavedChangesDialog from "$lib/components/unsaved-changes-dialog.svelte";
  import { profile } from "$lib/stores/profile.svelte";

  let { children } = $props();

  beforeNavigate((navigation) => {
    const { cancel, to, willUnload, type } = navigation;
    if (willUnload) return;

    if (
      profile.pendingNavigation &&
      to?.url.href === profile.pendingNavigation.href
    ) {
      profile.pendingNavigation = null;
      return;
    }

    if (profile.dirtyForms.size > 0 && !profile.unsavedChangesDialogOpen) {
      cancel();
      const delta =
        type === "popstate" && "delta" in navigation
          ? (navigation.delta as number)
          : undefined;
      profile.pendingNavigation = to?.url.href
        ? { href: to.url.href, delta }
        : null;
      profile.unsavedChangesDialogOpen = true;
      return;
    }

    if (profile.unsavedChangesDialogOpen) {
      cancel();
    }
  });

  async function handleConfirm() {
    const pending = profile.pendingNavigation;
    profile.unsavedChangesDialogOpen = false;
    profile.dirtyForms.clear();
    profile.pendingNavigation = null;
    if (pending) {
      try {
        if (pending.delta !== undefined) {
          history.go(pending.delta);
        } else {
          await goto(pending.href);
        }
      } catch {
        window.location.assign(pending.href);
      }
    }
  }

  function handleCancel() {
    profile.unsavedChangesDialogOpen = false;
    profile.pendingNavigation = null;
  }
</script>

<div class="flex min-h-screen items-center justify-center bg-background p-4">
  <div class="w-full max-w-md space-y-6">
    <div class="flex flex-col items-center gap-2 text-center">
      <img
        src="/mokumo-cloud.png"
        alt="Mokumo"
        class="h-16 dark:invert select-none"
        draggable="false"
        oncontextmenu={(e) => e.preventDefault()}
      />
      <span class="text-lg font-semibold tracking-tight">Mokumo Print</span>
    </div>
    {@render children()}
  </div>
</div>
<UnsavedChangesDialog
  open={profile.unsavedChangesDialogOpen}
  onconfirm={handleConfirm}
  oncancel={handleCancel}
/>
