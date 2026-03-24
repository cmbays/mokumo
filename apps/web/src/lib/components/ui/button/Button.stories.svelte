<script module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import Button from "./button.svelte";

  const { Story } = defineMeta({
    title: "UI/Button",
    component: Button,
    tags: ["autodocs"],
  });
</script>

<Story name="Default">
  <Button>Click me</Button>
</Story>

<Story name="Secondary">
  <Button variant="secondary">Secondary</Button>
</Story>

<Story name="Outline">
  <Button variant="outline">Outline</Button>
</Story>

<Story name="Ghost">
  <Button variant="ghost">Ghost</Button>
</Story>

<Story name="Destructive">
  <Button variant="destructive">Destructive</Button>
</Story>

<Story name="Link">
  <Button variant="link">Link</Button>
</Story>

<Story name="Small">
  <Button size="sm">Small</Button>
</Story>

<Story name="Large">
  <Button size="lg">Large</Button>
</Story>

<Story name="Disabled">
  <Button disabled>Disabled</Button>
</Story>
