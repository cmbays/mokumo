<script module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { Avatar, AvatarImage, AvatarFallback } from "./index.js";

  const { Story } = defineMeta({
    title: "UI/Avatar",
    component: Avatar,
    tags: ["autodocs"],
  });
</script>

<Story name="Default">
  <Avatar>
    <AvatarFallback>CN</AvatarFallback>
  </Avatar>
</Story>
