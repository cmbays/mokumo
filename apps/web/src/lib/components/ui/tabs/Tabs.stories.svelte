<script module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { Tabs, TabsList, TabsTrigger, TabsContent } from "./index.js";

  const { Story } = defineMeta({
    title: "UI/Tabs",
    component: Tabs,
    tags: ["autodocs"],
  });
</script>

<Story name="Default">
  <Tabs value="account" class="w-[400px]">
    <TabsList>
      <TabsTrigger value="account">Account</TabsTrigger>
      <TabsTrigger value="password">Password</TabsTrigger>
    </TabsList>
    <TabsContent value="account">
      <p class="text-muted-foreground text-sm">Account settings go here.</p>
    </TabsContent>
    <TabsContent value="password">
      <p class="text-muted-foreground text-sm">Password settings go here.</p>
    </TabsContent>
  </Tabs>
</Story>
