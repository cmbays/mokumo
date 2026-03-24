import { expect } from "@playwright/test";
import { Given } from "../support/storybook.fixture";

Given("Storybook is running", async ({ page, storybookUrl }) => {
  await page.goto(storybookUrl);
  await expect(page).toHaveTitle(/storybook/i);
});

Given("Storybook is showing a component story", async ({ page, storybookUrl }) => {
  await page.goto(`${storybookUrl}/?path=/story/ui-button--default`);
  await expect(page.locator("#storybook-preview-iframe")).toBeVisible();
});

Given("Storybook is showing a component in light mode", async ({ page, storybookUrl }) => {
  await page.goto(`${storybookUrl}/?path=/story/ui-button--default&globals=mode:light`);
  await expect(page.locator("#storybook-preview-iframe")).toBeVisible();
});

Given("Storybook is showing a component in dark mode", async ({ page, storybookUrl }) => {
  await page.goto(`${storybookUrl}/?path=/story/ui-button--default&globals=mode:dark`);
  await expect(page.locator("#storybook-preview-iframe")).toBeVisible();
});

Given(
  /Storybook is showing a component with (.+) theme/,
  async ({ page, storybookUrl }, theme: string) => {
    const themeSlug = theme.toLowerCase().replace(/\s+/g, "-");
    await page.goto(`${storybookUrl}/?path=/story/ui-button--default&globals=theme:${themeSlug}`);
    await expect(page.locator("#storybook-preview-iframe")).toBeVisible();
  },
);

Given(
  /Storybook is showing a component in dark mode with (.+) theme/,
  async ({ page, storybookUrl }, theme: string) => {
    const themeSlug = theme.toLowerCase().replace(/\s+/g, "-");
    await page.goto(
      `${storybookUrl}/?path=/story/ui-button--default&globals=mode:dark;theme:${themeSlug}`,
    );
    await expect(page.locator("#storybook-preview-iframe")).toBeVisible();
  },
);
