<script module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { Textarea } from "./index.js";

  const { Story } = defineMeta({
    title: "UI/Textarea",
    component: Textarea,
    tags: ["autodocs"],
  });
</script>

<Story name="Default">
  <Textarea placeholder="Type your message here." />
</Story>
