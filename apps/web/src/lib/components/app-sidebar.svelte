<script lang="ts">
  import { page } from "$app/stores";
  import { navItems } from "$lib/config/nav-items";
  import * as Avatar from "$lib/components/ui/avatar";
  import * as Sidebar from "$lib/components/ui/sidebar";
  import UserRound from "@lucide/svelte/icons/user-round";

  const visibleItems = navItems.filter((item) => !item.hidden);

  function isActive(url: string, pathname: string): boolean {
    if (url === "/") return pathname === "/";
    return pathname.startsWith(url);
  }
</script>

<Sidebar.Sidebar variant="sidebar" collapsible="icon">
  <Sidebar.SidebarContent>
    <Sidebar.SidebarGroup>
      <Sidebar.SidebarMenu>
        {#each visibleItems as item (item.url)}
          <Sidebar.SidebarMenuItem>
            <Sidebar.SidebarMenuButton
              isActive={isActive(item.url, $page.url.pathname)}
              tooltipContent={item.title}
            >
              {#snippet child({ props })}
                <a href={item.url} {...props}>
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              {/snippet}
            </Sidebar.SidebarMenuButton>
          </Sidebar.SidebarMenuItem>
        {/each}
      </Sidebar.SidebarMenu>
    </Sidebar.SidebarGroup>
  </Sidebar.SidebarContent>
  <Sidebar.SidebarFooter>
    <Sidebar.SidebarMenu>
      <Sidebar.SidebarMenuItem>
        <div class="flex items-center gap-2 px-2 py-1.5">
          <Avatar.Avatar class="size-6">
            <Avatar.AvatarFallback>
              <UserRound class="size-4" />
            </Avatar.AvatarFallback>
          </Avatar.Avatar>
          <span class="text-sm font-medium group-data-[collapsible=icon]:hidden"
            >Owner</span
          >
        </div>
      </Sidebar.SidebarMenuItem>
    </Sidebar.SidebarMenu>
  </Sidebar.SidebarFooter>
  <Sidebar.SidebarRail />
</Sidebar.Sidebar>
