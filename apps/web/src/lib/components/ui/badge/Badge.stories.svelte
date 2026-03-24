<script module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { Badge } from "./index.js";

  const { Story } = defineMeta({
    title: "UI/Badge",
    component: Badge,
    tags: ["autodocs"],
  });
</script>

<Story name="Default">
  <Badge>Default</Badge>
</Story>

<Story name="Secondary">
  <Badge variant="secondary">Secondary</Badge>
</Story>

<Story name="Outline">
  <Badge variant="outline">Outline</Badge>
</Story>

<Story name="Destructive">
  <Badge variant="destructive">Destructive</Badge>
</Story>
