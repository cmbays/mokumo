import { expect } from "@playwright/test";
import { Given, Then, When } from "../support/app.fixture";
import { archiveCustomer, seedCustomer } from "./customer-shared.steps";

Then("a confirmation dialog appears", async ({ page }) => {
  await expect(page.getByRole("alertdialog").or(page.getByRole("dialog"))).toBeVisible();
});

When("I confirm the archive", async ({ page }) => {
  const dialog = page.getByRole("alertdialog").or(page.getByRole("dialog"));
  await dialog.getByRole("button", { name: "Archive" }).click();
});

Then("I am redirected to the Customers page", async ({ page }) => {
  await expect(page).toHaveURL(/\/customers$/);
});

Given(
  "{string} has been archived",
  async ({ freshBackend, apiContext, customerContext }, name: string) => {
    void freshBackend;
    const customer = await seedCustomer(apiContext, { display_name: name });
    await archiveCustomer(apiContext, customer.id);
    customerContext.customers = [customer];
    customerContext.lastCustomer = customer;
  },
);
