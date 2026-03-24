<script module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { RadioGroup, RadioGroupItem } from "./index.js";
  import { Label } from "../label/index.js";

  const { Story } = defineMeta({
    title: "UI/Radio Group",
    component: RadioGroup,
    tags: ["autodocs"],
  });
</script>

<Story name="Default">
  <RadioGroup value="option-one">
    <div class="flex items-center space-x-2">
      <RadioGroupItem value="option-one" id="option-one" />
      <Label for="option-one">Option One</Label>
    </div>
    <div class="flex items-center space-x-2">
      <RadioGroupItem value="option-two" id="option-two" />
      <Label for="option-two">Option Two</Label>
    </div>
  </RadioGroup>
</Story>
