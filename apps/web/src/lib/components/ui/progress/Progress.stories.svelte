<script module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { Progress } from "./index.js";

  const { Story } = defineMeta({
    title: "UI/Progress",
    component: Progress,
    tags: ["autodocs"],
  });
</script>

<Story name="Default">
  <Progress value={60} />
</Story>
