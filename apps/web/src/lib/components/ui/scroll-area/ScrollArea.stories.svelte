<script module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { ScrollArea } from "./index.js";
  import { Separator } from "../separator/index.js";

  const { Story } = defineMeta({
    title: "UI/Scroll Area",
    component: ScrollArea,
    tags: ["autodocs"],
  });

  const tags = Array.from({ length: 50 }).map((_, i) => `Tag ${i + 1}`);
</script>

<Story name="Default">
  <ScrollArea class="h-72 w-48 rounded-md border">
    <div class="p-4">
      <h4 class="mb-4 text-sm font-medium leading-none">Tags</h4>
      {#each tags as tag}
        <div class="text-sm">{tag}</div>
        <Separator class="my-2" />
      {/each}
    </div>
  </ScrollArea>
</Story>
