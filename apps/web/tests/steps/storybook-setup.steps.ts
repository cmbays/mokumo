import { expect } from "@playwright/test";
import { When, Then } from "../support/storybook.fixture";

When("I view a Button story", async ({ page, storybookUrl }) => {
  await page.goto(`${storybookUrl}/iframe.html?id=ui-button--default&viewMode=story`);
  await expect(page.locator('[data-slot="button"]').first()).toBeVisible({ timeout: 15_000 });
});

Then(
  "the {string} CSS variable is defined on the root element",
  async ({ page }, varName: string) => {
    const value = await page.locator(":root").evaluate((el, prop) => {
      return getComputedStyle(el).getPropertyValue(prop).trim();
    }, varName);
    expect(value).not.toBe("");
  },
);

Then("the Button is visible and interactive", async ({ page }) => {
  const button = page.locator('[data-slot="button"]').first();
  await expect(button).toBeVisible();
  await expect(button).toBeEnabled();
});

When("I view any component story", async ({ page, storybookUrl }) => {
  await page.goto(`${storybookUrl}/iframe.html?id=ui-button--default&viewMode=story`);
  await expect(page.locator('[data-slot="button"]').first()).toBeVisible({ timeout: 15_000 });
});

Then("the root element has a computed {string} CSS variable", async ({ page }, varName: string) => {
  const value = await page.locator(":root").evaluate((el, prop) => {
    return getComputedStyle(el).getPropertyValue(prop).trim();
  }, varName);
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
