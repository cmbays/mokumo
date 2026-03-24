<script module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import {
    Collapsible,
    CollapsibleTrigger,
    CollapsibleContent,
  } from "./index.js";
  import Button from "../button/button.svelte";

  const { Story } = defineMeta({
    title: "UI/Collapsible",
    component: Collapsible,
    tags: ["autodocs"],
  });
</script>

<Story name="Default">
  <Collapsible class="w-[350px] space-y-2">
    <div class="flex items-center justify-between space-x-4 px-4">
      <h4 class="text-sm font-semibold">Starred repositories</h4>
      <CollapsibleTrigger>
        <Button variant="ghost" size="sm">Toggle</Button>
      </CollapsibleTrigger>
    </div>
    <div class="rounded-md border px-4 py-3 font-mono text-sm">
      @radix-ui/primitives
    </div>
    <CollapsibleContent class="space-y-2">
      <div class="rounded-md border px-4 py-3 font-mono text-sm">
        @radix-ui/colors
      </div>
      <div class="rounded-md border px-4 py-3 font-mono text-sm">
        @stitches/react
      </div>
    </CollapsibleContent>
  </Collapsible>
</Story>
