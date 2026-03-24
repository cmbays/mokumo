import { expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { When, Then } from "../support/storybook.fixture";

let axeResults: Awaited<ReturnType<AxeBuilder["analyze"]>>;

When("I open the accessibility panel", async ({ page }) => {
  // Reset to prevent stale results from a previous scenario in the same worker
  axeResults = undefined!;
  axeResults = await new AxeBuilder({ page }).include("body").analyze();
});

Then("axe-core violations are displayed at warning level", async () => {
  // Warning level: log violations but do not fail the test.
  // At M0 we surface a11y issues without blocking the build.
  if (axeResults.violations.length > 0) {
    const summary = axeResults.violations
      .map((v) => `[${v.impact}] ${v.id}: ${v.description} (${v.nodes.length} nodes)`)
      .join("\n");
    console.warn(`axe-core found ${axeResults.violations.length} violation(s):\n${summary}`);
  }
  expect(axeResults).toBeDefined();
  expect(axeResults.testEngine.name).toBe("axe-core");
});
