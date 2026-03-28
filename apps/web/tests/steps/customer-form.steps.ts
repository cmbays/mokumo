import { expect } from "@playwright/test";
import type { DataTable } from "playwright-bdd";
import { Given, Then, When } from "../support/app.fixture";
import { seedCustomer } from "./customer-shared.steps";

const FIELD_ID_MAP: Record<string, string> = {
  "Display name": "#display_name",
  "Company name": "#company_name",
  Email: "#email",
  Phone: "#phone",
  "Address line 1": '[placeholder="Street address"]',
  City: '[placeholder="City"]',
  State: '[placeholder="State"]',
  "Postal code": '[placeholder="Postal code"]',
  Notes: "#notes",
  "Credit limit": "#credit_limit",
};

const TOAST_SELECTOR = "[data-sonner-toast]";

// --- Create Steps ---

Given("I open the create customer form", async ({ freshBackend, axumUrl, page }) => {
  void freshBackend;
  await page.goto(`${axumUrl}/customers`);
  await expect(
    page.getByRole("heading", { name: "Customers" }).or(page.getByText("No customers yet")),
  ).toBeVisible({ timeout: 10_000 });
  await page.getByRole("button", { name: "Add Customer" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
});

When("I fill in {string} with {string}", async ({ page }, fieldName: string, value: string) => {
  const selector = FIELD_ID_MAP[fieldName];
  if (!selector) throw new Error(`Unknown form field: ${fieldName}`);
  const dialog = page.getByRole("dialog");
  await dialog.locator(selector).fill(value);
});

When("I fill in the following fields:", async ({ page }, dataTable: DataTable) => {
  const dialog = page.getByRole("dialog");
  for (const row of dataTable.hashes()) {
    const fieldName = row.field;
    const value = row.value;
    if (fieldName === "Payment terms") {
      await dialog.locator("#payment_terms").click();
      await page.getByRole("option", { name: value }).click();
    } else {
      const selector = FIELD_ID_MAP[fieldName];
      if (!selector) throw new Error(`Unknown form field: ${fieldName}`);
      await dialog.locator(selector).fill(value);
    }
  }
});

When("I submit the form", async ({ page }) => {
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: /Create|Save Changes/ }).click();
});

When("I leave {string} empty", async ({ page }, fieldName: string) => {
  const selector = FIELD_ID_MAP[fieldName];
  if (!selector) throw new Error(`Unknown form field: ${fieldName}`);
  const dialog = page.getByRole("dialog");
  await dialog.locator(selector).clear();
});

When("I close the form sheet", async ({ page }) => {
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
});

Then("I see a {string} toast notification", async ({ page }, message: string) => {
  await expect(page.locator(TOAST_SELECTOR).filter({ hasText: message }).first()).toBeVisible({
    timeout: 10_000,
  });
});

Then("the form sheet closes", async ({ page }) => {
  await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 5_000 });
});

Then("{string} appears in the customer list", async ({ page }, name: string) => {
  // Wait for the form dialog to close, then verify the name appears on the page (table or list)
  await expect(page.getByRole("dialog")).toHaveCount(0, { timeout: 5_000 });
  await expect(page.getByText(name).first()).toBeVisible({ timeout: 10_000 });
});

Then("{string} does not appear in the customer list", async ({ page }, name: string) => {
  await expect(page.locator("table").getByText(name)).toHaveCount(0);
});

Then("I see a validation error on {string}", async ({ page }, fieldName: string) => {
  const selector = FIELD_ID_MAP[fieldName];
  if (!selector) throw new Error(`Unknown form field: ${fieldName}`);
  const dialog = page.getByRole("dialog");
  // Find the field's parent form-item container and check for validation error text
  const field = dialog.locator(selector);
  const formItem = field.locator("xpath=ancestor::div[contains(@class,'space-y')]").first();
  await expect(
    formItem.locator(".text-destructive").or(dialog.locator(".text-destructive").first()),
  ).toBeVisible();
});

Then("the form sheet remains open", async ({ page }) => {
  await expect(page.getByRole("dialog")).toBeVisible();
});

// --- Edit Steps ---

Given(
  "I am on the detail page for customer {string}",
  async ({ freshBackend, apiContext, customerContext, axumUrl, page }, name: string) => {
    void freshBackend;
    const customer = await seedCustomer(apiContext, { display_name: name });
    customerContext.customers = [customer];
    customerContext.lastCustomer = customer;
    await page.goto(`${axumUrl}/customers/${customer.id}`);
    await expect(page.getByRole("heading", { name })).toBeVisible({ timeout: 10_000 });
  },
);

Given(
  "I am editing customer {string}",
  async ({ freshBackend, apiContext, customerContext, axumUrl, page }, name: string) => {
    void freshBackend;
    const customer = await seedCustomer(apiContext, { display_name: name });
    customerContext.customers = [customer];
    customerContext.lastCustomer = customer;
    await page.goto(`${axumUrl}/customers/${customer.id}`);
    await expect(page.getByRole("heading", { name })).toBeVisible({ timeout: 10_000 });
    await page.getByRole("button", { name: "Edit" }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
  },
);

Then("the {string} field shows {string}", async ({ page }, fieldName: string, value: string) => {
  const selector = FIELD_ID_MAP[fieldName];
  if (!selector) throw new Error(`Unknown form field: ${fieldName}`);
  const dialog = page.getByRole("dialog");
  await expect(dialog.locator(selector)).toHaveValue(value);
});

When("I change {string} to {string}", async ({ page }, fieldName: string, value: string) => {
  const selector = FIELD_ID_MAP[fieldName];
  if (!selector) throw new Error(`Unknown form field: ${fieldName}`);
  const dialog = page.getByRole("dialog");
  await dialog.locator(selector).clear();
  await dialog.locator(selector).fill(value);
});
