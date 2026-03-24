<script module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import {
    Sheet,
    SheetTrigger,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
  } from "./index.js";
  import Button from "../button/button.svelte";

  const { Story } = defineMeta({
    title: "UI/Sheet",
    component: Sheet,
    tags: ["autodocs"],
  });
</script>

<Story name="Default">
  <Sheet>
    <SheetTrigger>
      <Button variant="outline">Open Sheet</Button>
    </SheetTrigger>
    <SheetContent>
      <SheetHeader>
        <SheetTitle>Sheet Title</SheetTitle>
        <SheetDescription>Sheet description goes here.</SheetDescription>
      </SheetHeader>
      <div class="py-4">
        <p class="text-muted-foreground text-sm">Sheet content area.</p>
      </div>
    </SheetContent>
  </Sheet>
</Story>
