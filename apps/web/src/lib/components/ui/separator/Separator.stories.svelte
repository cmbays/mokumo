<script module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { Separator } from "./index.js";

  const { Story } = defineMeta({
    title: "UI/Separator",
    component: Separator,
    tags: ["autodocs"],
  });
</script>

<Story name="Default">
  <div class="space-y-1">
    <h4 class="text-sm font-medium leading-none">Section Title</h4>
    <p class="text-muted-foreground text-sm">Description text here.</p>
  </div>
  <Separator class="my-4" />
  <div class="flex h-5 items-center space-x-4 text-sm">
    <span>Item 1</span>
    <Separator orientation="vertical" />
    <span>Item 2</span>
    <Separator orientation="vertical" />
    <span>Item 3</span>
  </div>
</Story>
