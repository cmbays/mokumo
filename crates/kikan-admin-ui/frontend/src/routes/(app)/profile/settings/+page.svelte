<script lang="ts">
  import EmptyState from "$lib/components/EmptyState.svelte";
</script>

<section class="p-8">
  <h1 class="mb-6 text-2xl font-semibold">Profile settings</h1>
  <EmptyState
    title="Profile settings arrives in a later session"
    description="Settings for the active profile will appear here once you can create or import a profile."
    primaryActionLabel="Open profile"
    onPrimaryAction={() => {}}
  />
</section>
