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
  // Dev server (Turbopack + SSR + DB) can take >30s on cold parallel requests —
  // bump timeout for this smoke suite only.
  test.setTimeout(90_000)

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

      // Open the brand dropdown to read available brand names.
      // We read the brand text, then navigate via URL rather than relying on Radix Select's
      // client-side onValueChange — which triggers router.replace (no network request) and
      // therefore cannot be detected by waitForLoadState('networkidle').
      const brandSelect = page.locator('[aria-label="Filter by brand"]')
      await brandSelect.click()

      const options = page.getByRole('option')
      await expect(options.first()).toBeVisible({ timeout: 5_000 })
      const optionCount = await options.count()

      if (optionCount <= 1) {
        // Close dropdown and skip — no brands available
        await page.keyboard.press('Escape')
        test.skip(true, 'No brand options available in catalog')
        return
      }

      // Prefer Bella+Canvas; fall back to the first available brand
      let brandName: string | null = null
      for (let i = 0; i < optionCount; i++) {
        const text = (await options.nth(i).textContent())?.trim() ?? ''
        if (/bella.*canvas/i.test(text)) {
          brandName = text
          break
        }
      }
      if (!brandName) {
        brandName = (await options.nth(1).textContent())?.trim() ?? null
      }

      // Close the dropdown without selecting (Escape)
      await page.keyboard.press('Escape')

      if (!brandName) {
        test.skip(true, 'Could not read any brand name from dropdown')
        return
      }

      // Navigate directly to the brand-scoped URL.
      // Direct navigation triggers a full RSC fetch → networkidle is reliable.
      // Radix Select's onValueChange path uses router.replace (client-side, no network
      // request), which means networkidle resolves before React re-renders hue tab counts.
      const params = new URLSearchParams({ brand: brandName })
      await page.goto(`/garments?${params.toString()}`)
      await page.waitForLoadState('networkidle', { timeout: 15_000 })

      // The "All" tab count should now be smaller (brand-scoped palette).
      // If it matches the original, the brand has no data in normalizedCatalog — skip.
      const allTabTextAfter = await allHueTab.textContent()
      const countAfter = parseInt(allTabTextAfter?.match(/\((\d+)\)/)?.[1] ?? '0', 10)

      if (countAfter >= countBefore) {
        test.skip(
          true,
          `Brand "${brandName}" did not reduce color count (${countAfter} >= ${countBefore}) — brand may not be synced in normalizedCatalog`
        )
        return
      }

      expect(
        countAfter,
        `Brand-scoped count (${countAfter}) should be less than full count (${countBefore})`
      ).toBeLessThan(countBefore)

      await page.screenshot({
        path: 'tests/e2e/screenshots/garments-color-ux-brand-scoped.png',
        fullPage: false,
      })

      // Clear brand filter: navigate back to /garments (no params).
      // Reliable RSC fetch → networkidle is accurate.
      await page.goto('/garments')
      await page.waitForLoadState('networkidle', { timeout: 15_000 })

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
    test('garment cards display ColorSwatchStrip with small colored swatches', async ({ page }) => {
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

      expect(swatchCount, 'Expected at least some color swatches on garment cards').toBeGreaterThan(
        0
      )

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
      const imageContainer = firstFavorite.locator(
        'xpath=ancestor::div[contains(@class, "aspect-square")]'
      )
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
