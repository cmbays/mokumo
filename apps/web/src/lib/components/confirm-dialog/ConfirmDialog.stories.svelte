<script module lang="ts">
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { ConfirmDialog } from "./index.js";

  const { Story } = defineMeta({
    title: "UI/ConfirmDialog",
    component: ConfirmDialog,
    tags: ["autodocs"],
  });
</script>

<script>
  import { Button } from "$lib/components/ui/button/index.js";
</script>

<Story name="Default">
  <ConfirmDialog
    title="Confirm action"
    description="Are you sure you want to proceed? This action can be undone."
    onConfirm={() => Promise.resolve()}
  >
    <Button variant="outline">Open dialog</Button>
  </ConfirmDialog>
</Story>

<Story name="Destructive">
  <ConfirmDialog
    title="Delete item"
    description="This action cannot be undone. This will permanently delete the item."
    variant="destructive"
    confirmLabel="Delete"
    onConfirm={() => Promise.resolve()}
  >
    <Button variant="destructive">Delete item</Button>
  </ConfirmDialog>
</Story>

<Story name="Loading">
  <ConfirmDialog
    title="Save changes"
    description="This may take a moment."
    onConfirm={() => new Promise((resolve) => setTimeout(resolve, 30000))}
  >
    <Button>Save changes</Button>
  </ConfirmDialog>
</Story>

<Story name="Error">
  <ConfirmDialog
    title="Confirm action"
    description="This operation may fail."
    onConfirm={() =>
      Promise.reject(new Error("Network error: unable to reach server"))}
  >
    <Button variant="outline">Try action</Button>
  </ConfirmDialog>
</Story>
