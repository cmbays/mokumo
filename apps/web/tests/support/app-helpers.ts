import type { APIRequestContext, Page } from "@playwright/test";

export const TEST_ADMIN = {
  email: "admin@test.local",
  password: "TestPassword123!",
  name: "Test Admin",
  shopName: "Test Shop",
};

/** Run the setup wizard on a fresh Axum backend. */
export async function runSetupWizard(ctx: APIRequestContext, setupToken: string): Promise<void> {
  const res = await ctx.post("/api/setup", {
    data: {
      setup_token: setupToken,
      admin_email: TEST_ADMIN.email,
      admin_name: TEST_ADMIN.name,
      admin_password: TEST_ADMIN.password,
      shop_name: TEST_ADMIN.shopName,
    },
  });
  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`Setup wizard failed (${res.status()}): ${body}`);
  }
}

/** Login via API and transfer session cookie to the browser context. */
export async function loginAndTransferCookies(
  ctx: APIRequestContext,
  baseURL: string,
  page: Page,
): Promise<void> {
  const res = await ctx.post("/api/auth/login", {
    data: { email: TEST_ADMIN.email, password: TEST_ADMIN.password },
  });
  if (!res.ok()) {
    const body = await res.text();
    throw new Error(`Login failed (${res.status()}): ${body}`);
  }
  // Transfer session cookie to browser so SPA API calls are authenticated
  const state = await ctx.storageState();
  if (state.cookies.length === 0) {
    throw new Error(
      "Login succeeded but no cookies were returned. " +
        "Check the backend's Set-Cookie header and SameSite attributes.",
    );
  }
  await page.context().addCookies(state.cookies);
}
