<script lang="ts">
  import AppSidebar from "$lib/components/app-sidebar.svelte";
  import AppTopbar from "$lib/components/app-topbar.svelte";
  import { SidebarInset, SidebarProvider } from "$lib/components/ui/sidebar";

  let { children } = $props();
</script>

<SidebarProvider>
  <AppSidebar />
  <SidebarInset>
    <AppTopbar />
    <main class="flex-1 p-4">
      {@render children()}
    </main>
  </SidebarInset>
</SidebarProvider>
