<script module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import {
    Tooltip,
    TooltipTrigger,
    TooltipContent,
    TooltipProvider,
  } from "./index.js";
  import Button from "../button/button.svelte";

  const { Story } = defineMeta({
    title: "UI/Tooltip",
    component: Tooltip,
    tags: ["autodocs"],
  });
</script>

<Story name="Default">
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger>
        <Button variant="outline">Hover me</Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>This is a tooltip</p>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
</Story>
