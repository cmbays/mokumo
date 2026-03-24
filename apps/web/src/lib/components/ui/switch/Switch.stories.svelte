<script module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { Switch } from "./index.js";
  import { Label } from "../label/index.js";

  const { Story } = defineMeta({
    title: "UI/Switch",
    component: Switch,
    tags: ["autodocs"],
  });
</script>

<Story name="Default">
  <div class="flex items-center space-x-2">
    <Switch id="airplane-mode" />
    <Label for="airplane-mode">Airplane Mode</Label>
  </div>
</Story>
