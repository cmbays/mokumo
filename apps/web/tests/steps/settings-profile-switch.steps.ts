import { expect, type Page } from "@playwright/test";
import { Given, When, Then } from "../support/app.fixture";

const SETUP_STATUS_ROUTE = "**/api/setup-status";
const SYSTEM_SETTINGS_PATH = "/settings/system";

async function mockSetupStatus(page: Page, setupMode: "demo" | "production"): Promise<void> {
  await page.route(SETUP_STATUS_ROUTE, (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        setup_complete: true,
        setup_mode: setupMode,
        is_first_launch: false,
        production_setup_complete: setupMode === "production",
        shop_name: null,
      }),
    }),
  );
}

async function navigateToSystemSettings(
  page: Page,
  setupMode: "demo" | "production",
): Promise<void> {
  await mockSetupStatus(page, setupMode);
  await page.goto(SYSTEM_SETTINGS_PATH);
  await page.waitForLoadState("networkidle");
}

// ────────────────────────────────────────────────────────────────────────────
// Givens
// ────────────────────────────────────────────────────────────────────────────

Given("I am on the System Settings page", async ({ page }) => {
  await navigateToSystemSettings(page, "demo");
});

// ────────────────────────────────────────────────────────────────────────────
// Whens
// ────────────────────────────────────────────────────────────────────────────

When("I navigate to the System Settings page", async ({ page }) => {
  // setup mode was already configured by a preceding Given step in profile-shared.steps.ts;
  // re-apply the mock using the page's already-registered route (profile-shared uses WeakMap state).
  // We navigate directly and rely on the existing route mock registered by the profile Given steps.
  await page.goto(SYSTEM_SETTINGS_PATH);
  await page.waitForLoadState("networkidle");
});

When('I click "Open Profile Switcher"', async ({ page }) => {
  await page.getByTestId("open-profile-switcher-btn").click();
});

// ────────────────────────────────────────────────────────────────────────────
// Thens
// ────────────────────────────────────────────────────────────────────────────

Then('I see an "Open Profile Switcher" button', async ({ page }) => {
  await expect(page.getByTestId("open-profile-switcher-btn")).toBeVisible();
});

Then("I remain on the System Settings page", async ({ page }) => {
  expect(page.url()).toContain(SYSTEM_SETTINGS_PATH);
});

Then('I see a "Reset Demo Data" button', async ({ page }) => {
  await expect(page.getByRole("button", { name: "Reset Demo Data" })).toBeVisible();
});

Then('I do not see a "Reset Demo Data" button', async ({ page }) => {
  await expect(page.getByRole("button", { name: "Reset Demo Data" })).not.toBeVisible();
});
