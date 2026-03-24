import { expect } from "@playwright/test";
import { When, Then } from "../support/storybook.fixture";
import { gotoStory, getCssVariableValue, BUTTON_SELECTOR } from "../support/storybook.helpers";

When("I view a Button story", async ({ page, storybookUrl }) => {
  await gotoStory(page, storybookUrl);
});

Then(
  "the {string} CSS variable is defined on the root element",
  async ({ page }, varName: string) => {
    const value = await getCssVariableValue(page, varName);
    expect(value).not.toBe("");
  },
);

Then("the Button is visible and interactive", async ({ page }) => {
  const button = page.locator(BUTTON_SELECTOR).first();
  await expect(button).toBeVisible();
  await expect(button).toBeEnabled();
});

When("I view any component story", async ({ page, storybookUrl }) => {
  await gotoStory(page, storybookUrl);
});

Then("the root element has a computed {string} CSS variable", async ({ page }, varName: string) => {
  const value = await getCssVariableValue(page, varName);
  expect(value).not.toBe("");
});

Then("Tailwind utility classes resolve to expected CSS properties", async ({ page }) => {
  const hasTailwind = await page.locator(":root").evaluate(() => {
    const testEl = document.createElement("div");
    testEl.className = "hidden";
    document.body.appendChild(testEl);
    const computed = getComputedStyle(testEl);
    const isHidden = computed.display === "none";
    document.body.removeChild(testEl);
    return isHidden;
  });
  expect(hasTailwind).toBe(true);
});
