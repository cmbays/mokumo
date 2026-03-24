<script lang="ts">
  import { page } from "$app/stores";
  import { navItems } from "$lib/config/nav-items";
  import * as Avatar from "$lib/components/ui/avatar";
  import * as Breadcrumb from "$lib/components/ui/breadcrumb";
  import { Separator } from "$lib/components/ui/separator";
  import { SidebarTrigger } from "$lib/components/ui/sidebar";
  import UserRound from "@lucide/svelte/icons/user-round";

  const titleBySlug = new Map(
    navItems.map((item) => [
      item.url.split("/").filter(Boolean)[0] ?? "",
      item.title,
    ]),
  );

  function labelForSlug(slug: string): string {
    return (
      titleBySlug.get(slug) ?? slug.charAt(0).toUpperCase() + slug.slice(1)
    );
  }

  const segments = $derived.by(() => {
    const pathname = $page.url.pathname;
    if (pathname === "/") return [{ label: "Home", href: "/" }];

    const parts = pathname.split("/").filter(Boolean);
    return parts.map((part, i) => ({
      label: labelForSlug(part),
      href: "/" + parts.slice(0, i + 1).join("/"),
    }));
  });
</script>

<header class="flex h-14 items-center gap-2 border-b px-4">
  <SidebarTrigger />
  <Separator orientation="vertical" class="mr-2 h-4" />
  <Breadcrumb.Breadcrumb>
    <Breadcrumb.BreadcrumbList>
      {#each segments as segment, i (segment.href)}
        {#if i > 0}
          <Breadcrumb.BreadcrumbSeparator />
        {/if}
        <Breadcrumb.BreadcrumbItem>
          {#if i === segments.length - 1}
            <Breadcrumb.BreadcrumbPage
              >{segment.label}</Breadcrumb.BreadcrumbPage
            >
          {:else}
            <Breadcrumb.BreadcrumbLink href={segment.href}>
              {segment.label}
            </Breadcrumb.BreadcrumbLink>
          {/if}
        </Breadcrumb.BreadcrumbItem>
      {/each}
    </Breadcrumb.BreadcrumbList>
  </Breadcrumb.Breadcrumb>
  <div class="ml-auto">
    <Avatar.Avatar class="size-8">
      <Avatar.AvatarFallback>
        <UserRound class="size-4" />
      </Avatar.AvatarFallback>
    </Avatar.Avatar>
  </div>
</header>
