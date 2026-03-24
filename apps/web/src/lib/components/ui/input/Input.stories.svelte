<script module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { Input } from "./index.js";

  const { Story } = defineMeta({
    title: "UI/Input",
    component: Input,
    tags: ["autodocs"],
  });
</script>

<Story name="Default">
  <Input placeholder="Enter text..." />
</Story>

<Story name="Disabled">
  <Input placeholder="Disabled" disabled />
</Story>
