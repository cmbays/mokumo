<script lang="ts">
  import EmptyState from "$lib/components/EmptyState.svelte";
</script>

<section class="p-8">
  <h1 class="mb-6 text-2xl font-semibold">Extensions</h1>
  <EmptyState
    title="Extensions arrives in a later session"
    description="This screen is pre-declared in lib/nav.ts so the chrome stays stable. The body lands when the matching wave runs and you can create or import items here."
    primaryActionLabel="Add item"
    onPrimaryAction={() => {}}
  />
</section>
