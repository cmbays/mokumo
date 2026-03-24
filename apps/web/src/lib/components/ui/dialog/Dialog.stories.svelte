<script module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import {
    Dialog,
    DialogTrigger,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
  } from "./index.js";
  import Button from "../button/button.svelte";

  const { Story } = defineMeta({
    title: "UI/Dialog",
    component: Dialog,
    tags: ["autodocs"],
  });
</script>

<Story name="Default">
  <Dialog>
    <DialogTrigger>
      <Button variant="outline">Open Dialog</Button>
    </DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Dialog Title</DialogTitle>
        <DialogDescription>Dialog description goes here.</DialogDescription>
      </DialogHeader>
      <p class="text-muted-foreground text-sm">Dialog content area.</p>
    </DialogContent>
  </Dialog>
</Story>
