import { expect } from "@playwright/test";
import { Given, When, Then } from "../support/app.fixture";

const MOCK_SERVER_INFO = {
  lan_url: "http://mokumo.local:3000",
  ip_url: "http://192.168.1.42:3000",
  mdns_active: true,
  host: "0.0.0.0",
  port: 3000,
};

const MOCK_SERVER_INFO_MDNS_INACTIVE = {
  ...MOCK_SERVER_INFO,
  mdns_active: false,
  lan_url: null,
};

Given("the server-info API returns LAN status", async ({ page }) => {
  await page.route("**/api/server-info", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_SERVER_INFO),
    }),
  );
});

Given("the server-info API returns mDNS inactive", async ({ page }) => {
  await page.route("**/api/server-info", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_SERVER_INFO_MDNS_INACTIVE),
    }),
  );
});

When("I navigate to the Shop settings page", async ({ page, appUrl }) => {
  await page.goto(`${appUrl}/settings/shop`);
  // Wait for the LAN Access card to appear (loading state resolves)
  await page.waitForSelector("text=LAN Access", { timeout: 10_000 });
});

Then("I see the {string} card", async ({ page }, cardTitle: string) => {
  const card = page.locator(`text=${cardTitle}`);
  await expect(card).toBeVisible();
});

Then("I see an {string} status badge", async ({ page }, status: string) => {
  const badge = page
    .getByRole("status")
    .filter({ hasText: status })
    .or(page.locator("[data-slot='badge']").filter({ hasText: status }));
  await expect(badge).toBeVisible();
});

Then("a {string} status badge", async ({ page }, status: string) => {
  const badge = page
    .getByRole("status")
    .filter({ hasText: status })
    .or(page.locator("[data-slot='badge']").filter({ hasText: status }));
  await expect(badge).toBeVisible();
});

Then("I see the LAN URL {string}", async ({ page }, url: string) => {
  const codeBlock = page.locator("code").filter({ hasText: url });
  await expect(codeBlock).toBeVisible();
});

Then("I see the IP address {string}", async ({ page }, ip: string) => {
  const codeBlock = page.locator("code").filter({ hasText: ip });
  await expect(codeBlock).toBeVisible();
});

Then("the displayed URLs include port {string}", async ({ page }, port: string) => {
  const codeBlocks = page.locator("code");
  const count = await codeBlocks.count();
  let foundPort = false;
  for (let i = 0; i < count; i++) {
    const text = await codeBlocks.nth(i).textContent();
    if (text?.includes(`:${port}`)) {
      foundPort = true;
      break;
    }
  }
  expect(foundPort, `Expected at least one URL containing port ${port}`).toBe(true);
});

Then("the LAN URL contains the mDNS hostname {string}", async ({ page }, hostname: string) => {
  const codeBlock = page.locator("code").filter({ hasText: hostname });
  await expect(codeBlock).toBeVisible();
});

Then("I see a {string} status badge", async ({ page }, status: string) => {
  const badge = page
    .getByRole("status")
    .filter({ hasText: status })
    .or(page.locator("[data-slot='badge']").filter({ hasText: status }));
  await expect(badge).toBeVisible();
});
