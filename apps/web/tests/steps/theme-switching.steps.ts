import { When, Then } from "../support/storybook.fixture";

// S1: Theme switching — step definitions wired as stubs (RED)
// Implementation comes in Session S1

When("I select the {string} theme", async (_ctx, _theme: string) => {
  throw new Error("Not implemented — S1: theme selection");
});

Then(
  /the "(.*)" CSS variable changes to the (.*) value/,
  async (_ctx, _varName: string, _theme: string) => {
    throw new Error("Not implemented — S1: theme CSS variable assertion");
  },
);

Then("the root element still has the {string} class", async (_ctx, _className: string) => {
  throw new Error("Not implemented — S1: class persistence assertion");
});

When("I open the theme switcher", async (_ctx) => {
  throw new Error("Not implemented — S1: open theme switcher");
});

Then("{string} is listed as an option", async (_ctx, _theme: string) => {
  throw new Error("Not implemented — S1: theme option assertion");
});
