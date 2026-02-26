import { test, expect } from '@playwright/test'

/**
 * Smoke test: garment color UX features — hue-bucket tabs, brand-scoped palette,
 * card color strips, and favorite star placement.
 *
 * Requires E2E_EMAIL + E2E_PASSWORD env vars when running against a production
 * deployment (auth enforced). In development mode (NODE_ENV=development) the
 * middleware bypasses auth automatically.
 *
 * Example (local dev server on worktree port):
 *   PLAYWRIGHT_BASE_URL=http://localhost:3002 npx playwright test garments-color-ux
 */

const EMAIL = process.env.E2E_EMAIL ?? ''
const PASSWORD = process.env.E2E_PASSWORD ?? ''
const REQUIRES_AUTH = !!EMAIL && !!PASSWORD

test.describe('Garment Color UX', () => {
  test.beforeEach(async ({ page }) => {
    if (!REQUIRES_AUTH) return

    await page.goto('/login', { waitUntil: 'networkidle' })
    await page.locator('#email').fill(EMAIL)
    await page.locator('#password').fill(PASSWORD)
    await page.locator('button[type="submit"]').click()
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20_000 })
  })

  // ---------------------------------------------------------------------------
  // 1. Page loads — /garments renders with category tabs
  // ---------------------------------------------------------------------------

  test.describe('Page load', () => {
    test('garments page renders with category tabs visible', async ({ page }) => {
      await page.goto('/garments')
      await page.waitForLoadState('networkidle', { timeout: 20_000 })

      // Guard: skip if redirected to login (missing credentials for non-dev env)
      if (page.url().includes('/login')) {
        test.skip(true, 'Redirected to login — set E2E_EMAIL and E2E_PASSWORD env vars')
        return
      }

      // The category tabs container should be visible
      const categoryTabsList = page.locator('[role="tablist"]').first()
      await expect(categoryTabsList).toBeVisible({ timeout: 10_000 })

      // Verify expected category tabs are present: All, T-Shirts, Polos, etc.
      const allTab = categoryTabsList.getByRole('tab', { name: 'All' })
      await expect(allTab).toBeVisible()

      const tshirtsTab = categoryTabsList.getByRole('tab', { name: 'T-Shirts' })
      await expect(tshirtsTab).toBeVisible()

      const polosTab = categoryTabsList.getByRole('tab', { name: 'Polos' })
      await expect(polosTab).toBeVisible()

      // Screenshot for visual inspection
      await page.screenshot({
        path: 'tests/e2e/screenshots/garments-color-ux-page-load.png',
        fullPage: false,
      })
    })
  })

  // ---------------------------------------------------------------------------
  // 2. Hue-bucket tabs — filter tabs with count badges
  // ---------------------------------------------------------------------------

  test.describe('Hue-bucket tabs', () => {
    test('color filter area shows hue tabs with count badges, "All" active by default', async ({
      page,
    }) => {
      await page.goto('/garments')
      await page.waitForLoadState('networkidle', { timeout: 20_000 })

      if (page.url().includes('/login')) {
        test.skip(true, 'Redirected to login — set E2E_EMAIL and E2E_PASSWORD env vars')
        return
      }

      // The color filter grid uses its own Tabs component (the second tablist on the page).
      // The first tablist is the category tabs; the hue-bucket tabs come after.
      const hueTabsList = page.locator('[role="tablist"]').nth(1)
      await expect(hueTabsList).toBeVisible({ timeout: 10_000 })

      // Verify "All" tab exists and contains a count badge in parentheses
      const allHueTab = hueTabsList.getByRole('tab', { name: /^All\s*\(\d+\)$/ })
      await expect(allHueTab).toBeVisible()

      // Verify the "All" tab is active by default (aria-selected or data-state)
      await expect(allHueTab).toHaveAttribute('data-state', 'active')

      // Verify at least a few hue-bucket tabs are present with count badges
      const bluesTab = hueTabsList.getByRole('tab', { name: /^Blues\s*\(\d+\)$/ })
      await expect(bluesTab).toBeVisible()

      const redsTab = hueTabsList.getByRole('tab', { name: /^Reds\s*\(\d+\)$/ })
      await expect(redsTab).toBeVisible()

      const greensTab = hueTabsList.getByRole('tab', { name: /^Greens\s*\(\d+\)$/ })
      await expect(greensTab).toBeVisible()

      const blacksGraysTab = hueTabsList.getByRole('tab', {
        name: /^Blacks & Grays\s*\(\d+\)$/,
      })
      await expect(blacksGraysTab).toBeVisible()

      // Screenshot showing hue tabs
      await page.screenshot({
        path: 'tests/e2e/screenshots/garments-color-ux-hue-tabs.png',
        fullPage: false,
      })
    })

    test('clicking "Blues" tab activates it and deactivates "All"', async ({ page }) => {
      await page.goto('/garments')
      await page.waitForLoadState('networkidle', { timeout: 20_000 })

      if (page.url().includes('/login')) {
        test.skip(true, 'Redirected to login — set E2E_EMAIL and E2E_PASSWORD env vars')
        return
      }

      const hueTabsList = page.locator('[role="tablist"]').nth(1)
      await expect(hueTabsList).toBeVisible({ timeout: 10_000 })

      // Click the Blues tab
      const bluesTab = hueTabsList.getByRole('tab', { name: /^Blues\s*\(\d+\)$/ })
      await bluesTab.click()

      // Verify Blues tab is now active
      await expect(bluesTab).toHaveAttribute('data-state', 'active')

      // Verify All tab is no longer active
      const allHueTab = hueTabsList.getByRole('tab', { name: /^All\s*\(\d+\)$/ })
      await expect(allHueTab).toHaveAttribute('data-state', 'inactive')

      // The swatch grid should now only show blue-family swatches
      // (we verify indirectly: the grid should still contain at least one swatch)
      const swatchGrid = page.locator('[role="group"][aria-label="Filter by color"]')
      await expect(swatchGrid).toBeVisible()
      const swatches = swatchGrid.locator('[role="checkbox"]')
      const count = await swatches.count()
      expect(count).toBeGreaterThan(0)

      await page.screenshot({
        path: 'tests/e2e/screenshots/garments-color-ux-blues-active.png',
        fullPage: false,
      })
    })
  })

  // ---------------------------------------------------------------------------
  // 3. Brand filter scopes color palette
  // ---------------------------------------------------------------------------

  test.describe('Brand filter scopes color palette', () => {
    test('selecting a brand reduces hue tab counts, clearing restores them', async ({ page }) => {
      await page.goto('/garments')
      await page.waitForLoadState('networkidle', { timeout: 20_000 })

      if (page.url().includes('/login')) {
        test.skip(true, 'Redirected to login — set E2E_EMAIL and E2E_PASSWORD env vars')
        return
      }

      const hueTabsList = page.locator('[role="tablist"]').nth(1)
      await expect(hueTabsList).toBeVisible({ timeout: 10_000 })

      // Capture the "All" tab count before applying brand filter
      const allHueTab = hueTabsList.getByRole('tab', { name: /^All\s*\(\d+\)$/ })
      const allTabTextBefore = await allHueTab.textContent()
      const countBefore = parseInt(allTabTextBefore?.match(/\((\d+)\)/)?.[1] ?? '0', 10)

      // Select "Bella+Canvas" from the brand dropdown
      const brandSelect = page.locator('[aria-label="Filter by brand"]')
      await brandSelect.click()

      // The Select content shows brand options — look for Bella+Canvas
      const bellaCanvasOption = page.getByRole('option', { name: /Bella\+Canvas/i })

      // If Bella+Canvas is not available in this dataset, try any other non-"All Brands" option
      const hasBellaCanvas = (await bellaCanvasOption.count()) > 0
      if (hasBellaCanvas) {
        await bellaCanvasOption.click()
      } else {
        // Fallback: pick the first non-"All Brands" option
        const options = page.getByRole('option')
        const optionCount = await options.count()
        if (optionCount > 1) {
          await options.nth(1).click()
        } else {
          test.skip(true, 'No brand options available in catalog')
          return
        }
      }

      // Wait for the UI to update after brand filter
      await page.waitForLoadState('networkidle', { timeout: 10_000 })

      // The "All" tab count should now be smaller (brand-scoped palette)
      const allTabTextAfter = await allHueTab.textContent()
      const countAfter = parseInt(allTabTextAfter?.match(/\((\d+)\)/)?.[1] ?? '0', 10)

      expect(
        countAfter,
        `Brand-scoped count (${countAfter}) should be less than full count (${countBefore})`
      ).toBeLessThan(countBefore)

      await page.screenshot({
        path: 'tests/e2e/screenshots/garments-color-ux-brand-scoped.png',
        fullPage: false,
      })

      // Clear the brand filter — click the "X" on the brand filter pill to restore counts
      // The brand filter pill has an aria-label like "Remove {brand} filter"
      const removeBrandButton = page.locator('button[aria-label^="Remove"][aria-label$="filter"]')
      const hasPill = (await removeBrandButton.count()) > 0

      if (hasPill) {
        await removeBrandButton.first().click()
      } else {
        // Fallback: re-select "All Brands" from dropdown
        await brandSelect.click()
        await page.getByRole('option', { name: 'All Brands' }).click()
      }

      await page.waitForLoadState('networkidle', { timeout: 10_000 })

      // Verify counts are restored to the original full set
      const allTabTextRestored = await allHueTab.textContent()
      const countRestored = parseInt(allTabTextRestored?.match(/\((\d+)\)/)?.[1] ?? '0', 10)

      expect(
        countRestored,
        `Restored count (${countRestored}) should equal original count (${countBefore})`
      ).toBe(countBefore)

      await page.screenshot({
        path: 'tests/e2e/screenshots/garments-color-ux-brand-cleared.png',
        fullPage: false,
      })
    })
  })

  // ---------------------------------------------------------------------------
  // 4. Garment card color strips
  // ---------------------------------------------------------------------------

  test.describe('Garment card color strips', () => {
    test('garment cards display ColorSwatchStrip with small colored swatches', async ({
      page,
    }) => {
      await page.goto('/garments')
      await page.waitForLoadState('networkidle', { timeout: 20_000 })

      if (page.url().includes('/login')) {
        test.skip(true, 'Redirected to login — set E2E_EMAIL and E2E_PASSWORD env vars')
        return
      }

      // Verify garment cards are present (grid view is default)
      const garmentCards = page.locator('[role="button"]').filter({
        has: page.locator('img, svg'), // cards contain either a real image or an SVG mockup
      })
      await expect(garmentCards.first()).toBeVisible({ timeout: 10_000 })

      const cardCount = await garmentCards.count()
      expect(cardCount).toBeGreaterThan(0)

      // Verify that at least some cards contain color swatch elements (role="img" on the swatch divs).
      // The ColorSwatchStrip renders div[role="img"] for each swatch color.
      const swatchImages = page.locator('div[role="img"][aria-label]')
      const swatchCount = await swatchImages.count()

      expect(
        swatchCount,
        'Expected at least some color swatches on garment cards'
      ).toBeGreaterThan(0)

      // Verify a swatch has a background color style (not just a placeholder)
      const firstSwatch = swatchImages.first()
      await expect(firstSwatch).toBeVisible()

      // The swatch should have the h-3 w-3 classes and be inside the card info strip
      await expect(firstSwatch).toHaveClass(/h-3/)
      await expect(firstSwatch).toHaveClass(/w-3/)

      await page.screenshot({
        path: 'tests/e2e/screenshots/garments-color-ux-card-strips.png',
        fullPage: false,
      })
    })
  })

  // ---------------------------------------------------------------------------
  // 5. FavoriteStar in image overlay
  // ---------------------------------------------------------------------------

  test.describe('FavoriteStar placement', () => {
    test('favorite star button appears inside the card image area', async ({ page }) => {
      await page.goto('/garments')
      await page.waitForLoadState('networkidle', { timeout: 20_000 })

      if (page.url().includes('/login')) {
        test.skip(true, 'Redirected to login — set E2E_EMAIL and E2E_PASSWORD env vars')
        return
      }

      // The image container has class "relative aspect-square w-full" and contains the FavoriteStar.
      // FavoriteStar renders as button[aria-label*="favorite"] with an aria-pressed attribute.
      const favoriteButtons = page.locator('button[aria-label*="favorite"]')
      await expect(favoriteButtons.first()).toBeVisible({ timeout: 10_000 })

      const firstFavorite = favoriteButtons.first()

      // Verify the star button is inside a container with aspect-square (the image area).
      // We check by navigating up to the closest aspect-square parent.
      const imageContainer = firstFavorite.locator('xpath=ancestor::div[contains(@class, "aspect-square")]')
      await expect(imageContainer).toBeVisible()

      // Verify the star is absolutely positioned (in the top-right corner overlay).
      // The parent wrapper div has class "absolute top-1.5 right-1.5".
      const positionWrapper = firstFavorite.locator('xpath=parent::div')
      await expect(positionWrapper).toHaveClass(/absolute/)

      // Verify the star button has aria-pressed (boolean toggle state)
      const pressedValue = await firstFavorite.getAttribute('aria-pressed')
      expect(pressedValue === 'true' || pressedValue === 'false').toBeTruthy()

      await page.screenshot({
        path: 'tests/e2e/screenshots/garments-color-ux-favorite-star.png',
        fullPage: false,
      })
    })
  })
})
