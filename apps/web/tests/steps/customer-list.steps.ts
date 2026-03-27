import { expect } from "@playwright/test";
import { Given, Then, When } from "../support/app.fixture";
import { seedCustomer, seedCustomers } from "./customer-shared.steps";

// --- Empty State ---

Then("I see an empty state with an {string} prompt", async ({ page }, buttonText: string) => {
  await expect(page.getByText("No customers yet")).toBeVisible();
  await expect(page.getByRole("button", { name: buttonText })).toBeVisible();
});

// --- Data Display ---

Then("each row shows the customer's name, company, email, and phone", async ({ page }) => {
  const headers = page.locator("table thead th");
  await expect(headers.nth(0)).toHaveText("Name");
  await expect(headers.nth(1)).toHaveText("Company");
  await expect(headers.nth(2)).toHaveText("Email");
  await expect(headers.nth(3)).toHaveText("Phone");
});

Then(
  "the KPI strip shows {string} as the total customer count",
  async ({ page }, count: string) => {
    await expect(page.getByText(`${count} total customer`)).toBeVisible();
  },
);

When("I click the {string} row in the table", async ({ axumUrl, page }, name: string) => {
  // Ensure we're on the customers page first
  if (!page.url().includes("/customers")) {
    await page.goto(`${axumUrl}/customers`);
    await expect(page.getByRole("heading", { name: "Customers" })).toBeVisible({ timeout: 10_000 });
  }
  await page.locator("table").getByText(name).click();
});

Then("I am on the Acme Printing detail page", async ({ page, customerContext }) => {
  const customer = customerContext.customers.find((c) => c.display_name === "Acme Printing");
  expect(customer, "Acme Printing should have been seeded").toBeTruthy();
  await expect(page).toHaveURL(new RegExp(`/customers/${customer!.id}`));
});

Given(
  "I am on the Customers page",
  async ({ freshBackend, apiContext, customerContext, axumUrl, page }) => {
    void freshBackend;
    const customers = await seedCustomers(apiContext, 3);
    customerContext.customers = customers;
    customerContext.lastCustomer = customers[customers.length - 1];
    await page.goto(`${axumUrl}/customers`);
    await expect(page.getByRole("heading", { name: "Customers" })).toBeVisible({ timeout: 10_000 });
  },
);

When("I click {string}", async ({ page }, text: string) => {
  await page.getByRole("button", { name: text }).click();
});

Then("the customer form sheet opens", async ({ page }) => {
  await expect(page.getByRole("dialog")).toBeVisible();
});

Then("the form fields are empty", async ({ page }) => {
  const dialog = page.getByRole("dialog");
  const nameInput = dialog.locator("#display_name");
  await expect(nameInput).toHaveValue("");
});

// --- Search ---

When("I type {string} in the search bar", async ({ axumUrl, page }, text: string) => {
  if (!page.url().includes("/customers")) {
    await page.goto(`${axumUrl}/customers`);
    await expect(page.getByRole("heading", { name: "Customers" })).toBeVisible({ timeout: 10_000 });
  }
  await page.getByPlaceholder("Search customers…").fill(text);
  // Wait for debounced search to trigger and results to update
  await page.waitForTimeout(500);
});

Then("only {string} appears in the table", async ({ page }, name: string) => {
  const rows = page.locator("table tbody tr");
  await expect(rows).toHaveCount(1);
  await expect(rows.first().getByText(name)).toBeVisible();
});

Given(
  "I am searching for {string} on the Customers page",
  async ({ freshBackend, apiContext, customerContext, axumUrl, page }, query: string) => {
    void freshBackend;
    const c1 = await seedCustomer(apiContext, { display_name: "Acme Printing" });
    const c2 = await seedCustomer(apiContext, { display_name: "Beta Apparel" });
    customerContext.customers = [c1, c2];
    await page.goto(`${axumUrl}/customers?search=${encodeURIComponent(query)}`);
    await expect(page.getByRole("heading", { name: "Customers" })).toBeVisible({ timeout: 10_000 });
  },
);

When("I clear the search bar", async ({ page }) => {
  const searchInput = page.getByPlaceholder("Search customers…");
  await searchInput.clear();
  await page.waitForTimeout(500);
});

Then("all customers appear in the table", async ({ page, customerContext }) => {
  const rows = page.locator("table tbody tr");
  await expect(rows).toHaveCount(customerContext.customers.length);
});

// --- Soft Delete Toggle ---

When("I toggle {string}", async ({ page }, label: string) => {
  await page.getByLabel(label).click();
  await page.waitForTimeout(500);
});

// --- Pagination ---

Then("I see pagination controls", async ({ page }) => {
  await expect(
    page.getByRole("button", { name: "Next" }).or(page.getByRole("button", { name: /next/i })),
  ).toBeVisible();
});

Given(
  "I am on page 1 of the customer list",
  async ({ freshBackend, apiContext, customerContext, axumUrl, page }) => {
    void freshBackend;
    const customers = await seedCustomers(apiContext, 26);
    customerContext.customers = customers;
    await page.goto(`${axumUrl}/customers`);
    await expect(page.getByRole("heading", { name: "Customers" })).toBeVisible({ timeout: 10_000 });
  },
);

When("I click the next page button", async ({ page }) => {
  await page
    .getByRole("button", { name: "Next" })
    .or(page.getByRole("button", { name: /next/i }))
    .click();
  await page.waitForTimeout(500);
});

Then("I see a different set of customers", async ({ page }) => {
  // Page 2 should have at least 1 row (26 total, 25 per page = 1 on page 2)
  const rows = page.locator("table tbody tr");
  await expect(rows).toHaveCount(1);
});

Then("the URL reflects page 2", async ({ page }) => {
  await expect(page).toHaveURL(/page=2/);
});

// --- URL State Persistence ---

When("I refresh the page", async ({ page }) => {
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Customers" }).or(page.getByText("No customers yet")),
  ).toBeVisible({ timeout: 10_000 });
});

Then("the search bar still shows {string}", async ({ page }, text: string) => {
  await expect(page.getByPlaceholder("Search customers…")).toHaveValue(text);
});

Then("the table is filtered to match {string}", async ({ page }, query: string) => {
  const rows = page.locator("table tbody tr");
  const count = await rows.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    const text = await rows.nth(i).textContent();
    expect(text?.toLowerCase()).toContain(query.toLowerCase());
  }
});

Given(
  "I am on the Customers page with no filters",
  async ({ freshBackend, apiContext, customerContext, axumUrl, page }) => {
    void freshBackend;
    const c1 = await seedCustomer(apiContext, { display_name: "Acme Printing" });
    const c2 = await seedCustomer(apiContext, { display_name: "Beta Apparel" });
    customerContext.customers = [c1, c2];
    await page.goto(`${axumUrl}/customers`);
    await expect(page.getByRole("heading", { name: "Customers" })).toBeVisible({ timeout: 10_000 });
  },
);

When("I search for {string}", async ({ page }, query: string) => {
  // Use URL navigation to create a proper history entry
  const url = new URL(page.url());
  url.searchParams.set("search", query);
  await page.goto(url.toString());
  await expect(page.getByRole("heading", { name: "Customers" })).toBeVisible({ timeout: 10_000 });
});

When("I press the browser back button", async ({ page }) => {
  await page.goBack();
  await expect(
    page.getByRole("heading", { name: "Customers" }).or(page.getByText("No customers yet")),
  ).toBeVisible({ timeout: 10_000 });
});

Then("the search bar is empty", async ({ page }) => {
  await expect(page.getByPlaceholder("Search customers…")).toHaveValue("");
});

Given(
  "I am on page 2 of the customer list",
  async ({ freshBackend, apiContext, customerContext, axumUrl, page }) => {
    void freshBackend;
    const customers = await seedCustomers(apiContext, 26);
    customerContext.customers = customers;
    await page.goto(`${axumUrl}/customers?page=2`);
    await expect(page.getByRole("heading", { name: "Customers" })).toBeVisible({ timeout: 10_000 });
  },
);

Then("I am still on page 2", async ({ page }) => {
  await expect(page).toHaveURL(/page=2/);
  const rows = page.locator("table tbody tr");
  await expect(rows).toHaveCount(1);
});
