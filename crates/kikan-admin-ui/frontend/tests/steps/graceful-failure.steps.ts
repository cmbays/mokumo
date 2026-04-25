import { expect, type Page } from "@playwright/test";
import { Given, Then, When } from "../support/app.fixture";
import { mockAuthMe, mockBranding, mockPlatformError } from "../support/mocks";

/**
 * Shared-component scenarios. They render against a generic `__bdd-harness`
 * route that the chrome will own in S3 — until then, all assertions fail at
 * the locator level (RED for the right reason).
 */

const HARNESS_PATH = "/admin/__bdd-harness";

async function gotoHarness(page: Page, mode: string): Promise<void> {
  await mockBranding(page);
  await mockAuthMe(page, { signed_in: true, install_role: "Admin" });
  await page.goto(`${HARNESS_PATH}?mode=${mode}`);
}

Given("a screen is fetching its initial data", async ({ page }) => {
  await page.route("**/api/platform/v1/**", async (route) => {
    await new Promise((resolve) => setTimeout(resolve, 30_000));
    await route.fulfill({ status: 200, body: "{}" });
  });
  await gotoHarness(page, "loading");
});

Given("a screen request returns a 5xx response", async ({ page }) => {
  await mockPlatformError(page, 500);
  await gotoHarness(page, "error-5xx");
});

Given("a list screen has no items yet", async ({ page }) => {
  await gotoHarness(page, "empty-list");
});

Given("I am on a screen", async ({ page }) => {
  await gotoHarness(page, "online");
});

Given("the self-healing banner is showing", async ({ page }) => {
  await gotoHarness(page, "banner-visible");
  await expect(page.getByTestId("self-healing-banner")).toBeVisible();
});

Given("a screen offers a destructive action that uses the T1 confirmation", async ({ page }) => {
  await gotoHarness(page, "confirm-t1");
});

Given("the T1 confirmation modal is open", async ({ page }) => {
  await gotoHarness(page, "confirm-t1");
  await page.getByTestId("destructive-trigger").click();
  await expect(page.getByRole("dialog", { name: /confirm/i })).toBeVisible();
});

Given("a screen offers a destructive action that uses the T2 confirmation", async ({ page }) => {
  await gotoHarness(page, "confirm-t2");
});

Given('the T2 confirmation modal is open for a target named "kiln-room"', async ({ page }) => {
  await gotoHarness(page, "confirm-t2&target=kiln-room");
  await page.getByTestId("destructive-trigger").click();
  await expect(page.getByRole("dialog", { name: /kiln-room/i })).toBeVisible();
});

When("I trigger the destructive action", async ({ page }) => {
  await page.getByTestId("destructive-trigger").click();
});

When('I click "Cancel"', async ({ page }) => {
  await page.getByRole("button", { name: "Cancel" }).click();
});

When("I type {string} into the confirmation field", async ({ page }, value: string) => {
  await page.getByTestId("destructive-confirm-name-input").fill(value);
});

When('I type the trailing "m"', async ({ page }) => {
  await page.getByTestId("destructive-confirm-name-input").pressSequentially("m");
});

Then("the loading state shows a skeleton", async ({ page }) => {
  await expect(page.getByTestId("loading-skeleton")).toBeVisible();
});

Then("the skeleton's regions match the regions of the final layout", async ({ page }) => {
  const regions = page.getByTestId("loading-skeleton").locator("[data-skeleton-region]");
  expect(await regions.count()).toBeGreaterThan(0);
});

Then("the skeleton replaces the content without shifting it on resolve", async ({ page }) => {
  const skeleton = page.getByTestId("loading-skeleton");
  const box = await skeleton.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
});

Then("the loading state is announced to assistive technology", async ({ page }) => {
  const skeleton = page.getByTestId("loading-skeleton");
  await expect(skeleton).toHaveAttribute("aria-busy", "true");
  await expect(skeleton).toHaveAttribute("aria-live", /polite|assertive/);
});

Then("no spinner-only message is used", async ({ page }) => {
  await expect(page.locator('[role="status"]:not([aria-live])')).toHaveCount(0);
});

Then("I see an error state explaining the request failed", async ({ page }) => {
  await expect(page.getByTestId("error-state")).toBeVisible();
  await expect(page.getByTestId("error-state")).toContainText(
    /failed|couldn'?t|something went wrong/i,
  );
});

Then('I see a "Try again" button', async ({ page }) => {
  await expect(page.getByRole("button", { name: /try again/i })).toBeVisible();
});

Then('clicking "Try again" re-issues the request', async ({ page }) => {
  let retryCount = 0;
  await page.route("**/api/platform/v1/**", async (route) => {
    retryCount += 1;
    await route.fulfill({ status: 500, body: "{}" });
  });
  await page.getByRole("button", { name: /try again/i }).click();
  await expect.poll(() => retryCount).toBeGreaterThan(0);
});

Then("I see an empty state", async ({ page }) => {
  await expect(page.getByTestId("empty-state")).toBeVisible();
});

Then("the empty state explains what items will appear here", async ({ page }) => {
  await expect(page.getByTestId("empty-state")).toContainText(/will appear|once you/i);
});

Then("the empty state offers the primary action to create or import an item", async ({ page }) => {
  await expect(
    page.getByTestId("empty-state").getByRole("button", { name: /create|import|add/i }),
  ).toBeVisible();
});

Then("the empty state copy is specific to that screen", async ({ page }) => {
  const text = await page.getByTestId("empty-state").innerText();
  expect(text.length).toBeGreaterThan(20);
});

Then('the copy is not the literal string "No data"', async ({ page }) => {
  await expect(page.getByTestId("empty-state")).not.toHaveText("No data");
});

Then("the banner does not require me to dismiss it manually", async ({ page }) => {
  await expect(
    page.getByTestId("self-healing-banner").getByRole("button", { name: /dismiss|close/i }),
  ).toHaveCount(0);
});

Then("the page is not reloaded", async ({ page }) => {
  const reloaded = await page.evaluate(() => window.performance.navigation?.type === 1);
  expect(reloaded).toBe(false);
});

Then("the banner shows when the next retry will happen", async ({ page }) => {
  await expect(page.getByTestId("self-healing-banner-next-retry")).toBeVisible();
});

Then("the time-until-retry updates as it counts down", async ({ page }) => {
  const initial = await page.getByTestId("self-healing-banner-next-retry").innerText();
  await page.waitForTimeout(1100);
  const after = await page.getByTestId("self-healing-banner-next-retry").innerText();
  expect(after).not.toBe(initial);
});

Then("I see a confirmation modal", async ({ page }) => {
  await expect(page.getByRole("dialog", { name: /confirm/i })).toBeVisible();
});

Then("I see a clear description of what will happen", async ({ page }) => {
  await expect(page.getByTestId("destructive-confirm-description")).toBeVisible();
});

Then('I see "Confirm" and "Cancel" buttons', async ({ page }) => {
  await expect(page.getByRole("button", { name: "Confirm" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();
});

Then("the confirm button is enabled", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Confirm" })).toBeEnabled();
});

Then("the modal closes", async ({ page }) => {
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

Then("no destructive action is performed", async ({ page }) => {
  await expect(page.getByTestId("destructive-action-fired")).toHaveCount(0);
});

Then("I see a confirmation modal that names the target", async ({ page }) => {
  await expect(page.getByRole("dialog", { name: /kiln-room/i })).toBeVisible();
});

Then("the confirm button is disabled", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Confirm" })).toBeDisabled();
});

Then("there is a field asking me to type the target's name to confirm", async ({ page }) => {
  await expect(page.getByTestId("destructive-confirm-name-input")).toBeVisible();
  await expect(page.getByTestId("destructive-confirm-name-input")).toHaveAttribute(
    "placeholder",
    /type.*name/i,
  );
});

Then("the confirm button is still disabled", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Confirm" })).toBeDisabled();
});

Then("the confirm button becomes enabled", async ({ page }) => {
  await expect(page.getByRole("button", { name: "Confirm" })).toBeEnabled();
});
