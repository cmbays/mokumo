<script module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { Label } from "./index.js";

  const { Story } = defineMeta({
    title: "UI/Label",
    component: Label,
    tags: ["autodocs"],
  });
</script>

<Story name="Default">
  <Label>Email address</Label>
</Story>
