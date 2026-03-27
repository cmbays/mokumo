import { expect } from "@playwright/test";
import { Then } from "../support/storybook.fixture";
import { storybookIframeUrl, toStoryId } from "../support/storybook.helpers";
import type { DataTable } from "playwright-bdd";

Then(
  "each of the following components has at least one story:",
  async ({ page, storybookUrl }, dataTable: DataTable) => {
    const rows = dataTable.rows();
    for (const [component] of rows) {
      const storyId = toStoryId(component);
      const url = storybookIframeUrl(storybookUrl, undefined, storyId);
      const response = await page.goto(url, { waitUntil: "load" });
      expect(
        response?.ok(),
        `Story "${storyId}" for ${component} did not load (HTTP ${response?.status()})`,
      ).toBe(true);

      // Check #storybook-root OR body for content — portal-based components
      // (Dialog, Select, Sheet, Sidebar) render outside #storybook-root.
      const root = page.locator("#storybook-root");
      await root.waitFor({ state: "attached", timeout: 5000 });
      const hasContent = await page.evaluate(() => {
        const root = document.getElementById("storybook-root");
        const rootContent = root ? root.innerHTML.trim().length > 0 : false;
        // Check for portal content rendered as direct children of body
        const portalContent = document.querySelectorAll("body > [data-bits-portal]").length > 0;
        return rootContent || portalContent;
      });
      expect(hasContent, `Story "${storyId}" for ${component} rendered no content`).toBe(true);
    }
  },
);
