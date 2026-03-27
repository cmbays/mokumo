import { expect } from "@playwright/test";
import { Given, Then, When } from "../support/app.fixture";
import { seedCustomer } from "./customer-shared.steps";

// --- Header Steps ---

Given(
  "a customer {string} with company {string} exists",
  async ({ freshBackend, apiContext, customerContext }, name: string, company: string) => {
    void freshBackend;
    const customer = await seedCustomer(apiContext, {
      display_name: name,
      company_name: company,
    });
    customerContext.customers = [customer];
    customerContext.lastCustomer = customer;
  },
);

When(
  "I navigate to the {string} detail page",
  async ({ axumUrl, page, customerContext }, name: string) => {
    const customer = customerContext.customers.find((c) => c.display_name === name);
    expect(customer).toBeTruthy();
    await page.goto(`${axumUrl}/customers/${customer!.id}`);
    await expect(page.getByRole("heading", { name })).toBeVisible({ timeout: 10_000 });
  },
);

Then("the header shows {string}", async ({ page }, text: string) => {
  // Use first() to avoid strict mode — text appears in heading, breadcrumb, and overview
  await expect(page.getByText(text).first()).toBeVisible();
});

Then("I see a deleted badge on the header", async ({ page }) => {
  await expect(page.getByText("Archived").first()).toBeVisible();
});

// --- Overview Tab Steps ---

Given(
  "a customer with email {string} and phone {string}",
  async ({ freshBackend, apiContext, customerContext }, email: string, phone: string) => {
    void freshBackend;
    const customer = await seedCustomer(apiContext, {
      display_name: "Test Customer",
      email,
      phone,
    });
    customerContext.customers = [customer];
    customerContext.lastCustomer = customer;
  },
);

Given(
  "a customer with notes {string}",
  async ({ freshBackend, apiContext, customerContext }, notes: string) => {
    void freshBackend;
    const customer = await seedCustomer(apiContext, {
      display_name: "Test Customer",
      notes,
    });
    customerContext.customers = [customer];
    customerContext.lastCustomer = customer;
  },
);

When("I view the customer's overview tab", async ({ axumUrl, page, customerContext }) => {
  const customer = customerContext.lastCustomer;
  expect(customer).toBeTruthy();
  await page.goto(`${axumUrl}/customers/${customer!.id}`);
  await expect(page.getByRole("heading", { name: customer!.display_name })).toBeVisible({
    timeout: 10_000,
  });
});

Then("the overview shows email {string}", async ({ page }, email: string) => {
  await expect(page.getByText(email).first()).toBeVisible();
});

Then("the overview shows phone {string}", async ({ page }, phone: string) => {
  await expect(page.getByText(phone).first()).toBeVisible();
});

Then("the overview shows notes {string}", async ({ page }, notes: string) => {
  await expect(page.getByText(notes)).toBeVisible();
});

// --- Tab Navigation Steps ---

Given(
  "I am on a customer's detail page",
  async ({ freshBackend, apiContext, customerContext, axumUrl, page }) => {
    void freshBackend;
    const customer = await seedCustomer(apiContext, { display_name: "Tab Test Customer" });
    customerContext.customers = [customer];
    customerContext.lastCustomer = customer;
    await page.goto(`${axumUrl}/customers/${customer.id}`);
    await expect(page.getByRole("heading", { name: "Tab Test Customer" })).toBeVisible({
      timeout: 10_000,
    });
  },
);

Given(
  "I am on customer {string}'s detail page",
  async ({ freshBackend, apiContext, customerContext, axumUrl, page }, name: string) => {
    void freshBackend;
    const customer = await seedCustomer(apiContext, { display_name: name });
    customerContext.customers = [customer];
    customerContext.lastCustomer = customer;
    await page.goto(`${axumUrl}/customers/${customer.id}`);
    await expect(page.getByRole("heading", { name })).toBeVisible({ timeout: 10_000 });
  },
);

Then(
  "I see tabs for Overview, Activity, Contacts, Artwork, Pricing, and Communication",
  async ({ page }) => {
    const tabNav = page.getByLabel("Tab navigation");
    for (const tab of ["Overview", "Activity", "Contacts", "Artwork", "Pricing", "Communication"]) {
      await expect(tabNav.getByRole("link", { name: tab })).toBeVisible();
    }
  },
);

When("I click the {string} tab", async ({ page }, tab: string) => {
  const tabNav = page.getByLabel("Tab navigation");
  await tabNav.getByRole("link", { name: tab }).click();
  await page.waitForTimeout(500);
});

Then("the URL path includes {string}", async ({ page }, segment: string) => {
  await expect(page).toHaveURL(new RegExp(segment.replace("/", "\\/")));
});

Then("the {string} tab is active", async ({ page }, tab: string) => {
  const tabNav = page.getByLabel("Tab navigation");
  const link = tabNav.getByRole("link", { name: tab });
  await expect(link).toHaveAttribute("aria-current", "page");
});

When(
  "I navigate to a customer's detail page",
  async ({ freshBackend, apiContext, customerContext, axumUrl, page }) => {
    void freshBackend;
    const customer = await seedCustomer(apiContext, { display_name: "Default Tab Customer" });
    customerContext.customers = [customer];
    customerContext.lastCustomer = customer;
    await page.goto(`${axumUrl}/customers/${customer.id}`);
    await expect(page.getByRole("heading", { name: "Default Tab Customer" })).toBeVisible({
      timeout: 10_000,
    });
  },
);

Then("the Overview tab is active", async ({ page }) => {
  const tabNav = page.getByLabel("Tab navigation");
  const link = tabNav.getByRole("link", { name: "Overview" });
  await expect(link).toHaveAttribute("aria-current", "page");
});
