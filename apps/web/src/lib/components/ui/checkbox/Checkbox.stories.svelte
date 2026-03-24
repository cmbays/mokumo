<script module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { Checkbox } from "./index.js";
  import { Label } from "../label/index.js";

  const { Story } = defineMeta({
    title: "UI/Checkbox",
    component: Checkbox,
    tags: ["autodocs"],
  });
</script>

<Story name="Default">
  <div class="flex items-center space-x-2">
    <Checkbox id="terms" />
    <Label for="terms">Accept terms and conditions</Label>
  </div>
</Story>
