import { createBdd } from "playwright-bdd";
import { test as base } from "playwright-bdd";

/**
 * playwright-bdd fixture entry point. Step files import { Given, When, Then }
 * from this module so playwright-bdd can wire them to the same `test`
 * instance referenced by `importTestFrom` in playwright.config.ts.
 *
 * Adding chrome-specific worker/test fixtures (auth state, branding seed,
 * etc.) here keeps step files declarative.
 */
export const test = base;

export const { Given, When, Then } = createBdd(test);
