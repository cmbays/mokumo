<script module>
  import { defineMeta } from "@storybook/addon-svelte-csf";
  import { Alert, AlertTitle, AlertDescription } from "./index.js";

  const { Story } = defineMeta({
    title: "UI/Alert",
    component: Alert,
    tags: ["autodocs"],
  });
</script>

<Story name="Default">
  <Alert>
    <AlertTitle>Heads up!</AlertTitle>
    <AlertDescription
      >You can add components to your app using the CLI.</AlertDescription
    >
  </Alert>
</Story>

<Story name="Destructive">
  <Alert variant="destructive">
    <AlertTitle>Error</AlertTitle>
    <AlertDescription
      >Your session has expired. Please log in again.</AlertDescription
    >
  </Alert>
</Story>
