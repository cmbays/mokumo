<script lang="ts">
  import { Button } from "$lib/components/ui/button/index.js";
</script>

<svelte:head>
  <title>No admin access · Mokumo Admin</title>
</svelte:head>

<main class="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 p-8 text-center">
  <h1 class="text-2xl font-semibold">No admin access</h1>
  <p class="text-sm text-muted-foreground">
    Your account doesn't have administrator permissions. Ask an installation
    administrator to grant you access if you need to manage this deployment.
  </p>
  <Button href="/">Back to shop</Button>
</main>
