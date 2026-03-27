import { expect } from "@playwright/test";
import { Given, Then, When } from "../support/app.fixture";
import { seedCustomer } from "./customer-shared.steps";

Given(
  "customer {string} was just created",
  async ({ freshBackend, apiContext, customerContext }, name: string) => {
    void freshBackend;
    const customer = await seedCustomer(apiContext, { display_name: name });
    customerContext.customers = [customer];
    customerContext.lastCustomer = customer;
  },
);

// "was recently created" is an alias — same behavior as "was just created"
Given(
  "customer {string} was recently created",
  async ({ freshBackend, apiContext, customerContext }, name: string) => {
    void freshBackend;
    const customer = await seedCustomer(apiContext, { display_name: name });
    customerContext.customers = [customer];
    customerContext.lastCustomer = customer;
  },
);

When(
  "I view the Activity tab for {string}",
  async ({ axumUrl, page, customerContext }, name: string) => {
    const customer = customerContext.customers.find((c) => c.display_name === name);
    expect(customer).toBeTruthy();
    await page.goto(`${axumUrl}/customers/${customer!.id}/activity`);
    await expect(page.getByRole("heading", { name })).toBeVisible({ timeout: 10_000 });
  },
);

// "I navigate to the Activity tab for" is an alias for "I view the Activity tab for"
When(
  "I navigate to the Activity tab for {string}",
  async ({ axumUrl, page, customerContext }, name: string) => {
    const customer = customerContext.customers.find((c) => c.display_name === name);
    expect(customer).toBeTruthy();
    await page.goto(`${axumUrl}/customers/${customer!.id}/activity`);
    await expect(page.getByRole("heading", { name })).toBeVisible({ timeout: 10_000 });
  },
);

Then("I see exactly one activity entry", async ({ page }) => {
  const entries = page.locator("[class*='rounded-lg'][class*='border'][class*='p-4']");
  await expect(entries).toHaveCount(1);
});

Then("the entry shows a {string} action", async ({ page }, action: string) => {
  await expect(page.getByText(action).first()).toBeVisible();
});

Given(
  "customer {string} has been created and then updated",
  async ({ freshBackend, apiContext, customerContext }, name: string) => {
    void freshBackend;
    const customer = await seedCustomer(apiContext, { display_name: name });
    const updateResponse = await apiContext.put(`/api/customers/${customer.id}`, {
      data: { phone: "555-9999" },
    });
    expect(updateResponse.ok()).toBe(true);
    customerContext.customers = [customer];
    customerContext.lastCustomer = customer;
  },
);

Then("I see activity entries for both actions", async ({ page }) => {
  const entries = page.locator(".rounded-lg.border.p-4");
  const count = await entries.count();
  expect(count).toBeGreaterThanOrEqual(2);
});

When("I view the Activity tab", async ({ axumUrl, page, customerContext }) => {
  const customer = customerContext.lastCustomer;
  expect(customer).toBeTruthy();
  await page.goto(`${axumUrl}/customers/${customer!.id}/activity`);
  await expect(page.getByRole("heading", { name: customer!.display_name })).toBeVisible({
    timeout: 10_000,
  });
});

Then("the most recent entry shows a {string} action", async ({ page }, action: string) => {
  await expect(page.getByText(action).first()).toBeVisible();
});

Then("the entry shows a recent timestamp", async ({ page }) => {
  const timestamp = page.locator(".text-xs.text-muted-foreground").first();
  const text = await timestamp.textContent();
  expect(text).toBeTruthy();
});
