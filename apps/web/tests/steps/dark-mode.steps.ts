import { When, Then } from "../support/storybook.fixture";

// S1: Dark mode — step definitions wired as stubs (RED)
// Implementation comes in Session S1

When("I toggle dark mode on", async (_ctx) => {
  throw new Error("Not implemented — S1: dark mode toggle");
});

Then("the {string} CSS variable resolves to a dark value", async (_ctx, _varName: string) => {
  throw new Error("Not implemented — S1: dark value assertion");
});

Then("the root element has the {string} class", async (_ctx, _className: string) => {
  throw new Error("Not implemented — S1: class assertion");
});

When("I toggle dark mode off", async (_ctx) => {
  throw new Error("Not implemented — S1: dark mode toggle off");
});

Then("the {string} CSS variable resolves to a light value", async (_ctx, _varName: string) => {
  throw new Error("Not implemented — S1: light value assertion");
});

Then("the root element does not have the {string} class", async (_ctx, _className: string) => {
  throw new Error("Not implemented — S1: class absence assertion");
});
