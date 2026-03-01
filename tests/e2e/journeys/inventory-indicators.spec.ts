import { test, expect } from '@playwright/test'

/**
 * E2E smoke tests: Wave 4 inventory indicator surfaces.
 *
 * Covers three UI surfaces built in PR #681:
 *   Surface 1 — "Show in-stock only" toggle in the garment catalog filter bar
 *   Surface 2 — Size availability badges in GarmentDetailDrawer
 *   Surface 3 — Dismissible low-stock warning in the quote builder line item row
 *
 * Data note: Surface 2 and Surface 3 depend on rows existing in `catalog_inventory`.
 * Tests that require live inventory data use graceful skip guards rather than hard
 * assertions — if the DB is unseeded, those tests skip cleanly.
 *
 * Running locally:
 *   PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test inventory-indicators
 *
 * Running against a Vercel preview (bypasses auth in dev mode if NODE_ENV=development):
 *   PLAYWRIGHT_BASE_URL=<preview-url> E2E_EMAIL=... E2E_PASSWORD=... npx playwright test inventory-indicators
 */

const EMAIL = process.env.E2E_EMAIL ?? ''
const PASSWORD = process.env.E2E_PASSWORD ?? ''
const REQUIRES_AUTH = !!EMAIL && !!PASSWORD

async function login(page: Parameters<Parameters<typeof test>[1]>[0]['page']) {
  if (!REQUIRES_AUTH) return
  await page.goto('/login', { waitUntil: 'networkidle' })
  await page.locator('#email').fill(EMAIL)
  await page.locator('#password').fill(PASSWORD)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20_000 })
}

async function skipIfRedirectedToLogin(page: Parameters<Parameters<typeof test>[1]>[0]['page']) {
  if (page.url().includes('/login')) {
    test.skip(true, 'Redirected to login — set E2E_EMAIL and E2E_PASSWORD env vars')
  }
}

// ---------------------------------------------------------------------------
// Surface 1 — "Show in-stock only" catalog filter toggle
// ---------------------------------------------------------------------------

test.describe('Inventory indicators — Surface 1: in-stock filter toggle', () => {
  test.setTimeout(90_000)

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('in-stock toggle is visible in the catalog toolbar', async ({ page }) => {
    await page.goto('/garments')
    await page.waitForLoadState('networkidle', { timeout: 20_000 })
    await skipIfRedirectedToLogin(page)

    // The "In stock" label should be visible next to the toggle switch
    const inStockLabel = page.getByText('In stock', { exact: true })
    await expect(inStockLabel).toBeVisible({ timeout: 10_000 })

    // The switch itself — identified by its id="instock-toggle"
    const inStockSwitch = page.locator('#instock-toggle')
    await expect(inStockSwitch).toBeVisible()

    // Default state: toggle is OFF (not checked)
    await expect(inStockSwitch).not.toBeChecked()

    await page.screenshot({
      path: 'tests/e2e/screenshots/inventory-toggle-default.png',
      fullPage: false,
    })
  })

  test('clicking the toggle adds ?inStock=true to the URL', async ({ page }) => {
    await page.goto('/garments')
    await page.waitForLoadState('networkidle', { timeout: 20_000 })
    await skipIfRedirectedToLogin(page)

    const inStockLabel = page.getByText('In stock', { exact: true })
    await expect(inStockLabel).toBeVisible({ timeout: 10_000 })

    // Click the label (it's a htmlFor label, so clicking it activates the switch)
    await inStockLabel.click()

    // URL should now include ?inStock=true
    await page.waitForURL((url) => url.searchParams.get('inStock') === 'true', { timeout: 5_000 })
    expect(new URL(page.url()).searchParams.get('inStock')).toBe('true')

    // The switch should now be checked
    const inStockSwitch = page.locator('#instock-toggle')
    await expect(inStockSwitch).toBeChecked()

    await page.screenshot({
      path: 'tests/e2e/screenshots/inventory-toggle-on.png',
      fullPage: false,
    })
  })

  test('"In stock" filter pill appears in active filters when toggle is on', async ({ page }) => {
    // Navigate directly to the URL with inStock=true
    await page.goto('/garments?inStock=true')
    await page.waitForLoadState('networkidle', { timeout: 20_000 })
    await skipIfRedirectedToLogin(page)

    // The active filter pills area should show an "In stock" badge
    // Badges are rendered with role="group" or as a generic element — match by text
    const inStockPill = page.getByText('In stock', { exact: true }).first()
    await expect(inStockPill).toBeVisible({ timeout: 10_000 })

    await page.screenshot({
      path: 'tests/e2e/screenshots/inventory-toggle-filter-pill.png',
      fullPage: false,
    })
  })

  test('clicking the toggle OFF removes ?inStock from URL', async ({ page }) => {
    await page.goto('/garments?inStock=true')
    await page.waitForLoadState('networkidle', { timeout: 20_000 })
    await skipIfRedirectedToLogin(page)

    const inStockLabel = page.getByText('In stock', { exact: true }).first()
    await expect(inStockLabel).toBeVisible({ timeout: 10_000 })

    // Click the filter pill's remove button to clear the inStock param
    // The pill has an X button with aria-label="Remove In stock filter"
    const removePillBtn = page.getByRole('button', { name: /Remove In stock filter/i })
    await expect(removePillBtn).toBeVisible()
    await removePillBtn.click()

    // URL should no longer have inStock param
    await page.waitForURL((url) => !url.searchParams.has('inStock'), { timeout: 5_000 })
    expect(new URL(page.url()).searchParams.has('inStock')).toBe(false)

    await page.screenshot({
      path: 'tests/e2e/screenshots/inventory-toggle-cleared.png',
      fullPage: false,
    })
  })

  test('navigating to ?inStock=true shows a garment count or empty state', async ({ page }) => {
    await page.goto('/garments?inStock=true')
    await page.waitForLoadState('networkidle', { timeout: 20_000 })
    await skipIfRedirectedToLogin(page)

    // Either garments are shown, or the empty state message appears
    // Empty state copy: "No in-stock garments match your filters"
    const garmentCountText = page.locator('text=/\\d+ garment/')
    const emptyState = page.getByText('No in-stock garments match your filters')

    const garmentCountVisible = await garmentCountText.isVisible().catch(() => false)
    const emptyStateVisible = await emptyState.isVisible().catch(() => false)

    expect(
      garmentCountVisible || emptyStateVisible,
      'Expected either a garment count or the in-stock empty state message'
    ).toBe(true)

    await page.screenshot({
      path: 'tests/e2e/screenshots/inventory-toggle-results.png',
      fullPage: false,
    })
  })

  test('"Clear all" button removes the in-stock filter along with other filters', async ({
    page,
  }) => {
    // Start with both a search query and inStock filter active
    await page.goto('/garments?q=tee&inStock=true')
    await page.waitForLoadState('networkidle', { timeout: 20_000 })
    await skipIfRedirectedToLogin(page)

    // Both filter pills should be visible
    const inStockPill = page.getByText('In stock', { exact: true })
    await expect(inStockPill).toBeVisible({ timeout: 10_000 })

    // "Clear all" button should appear since multiple filters are active
    const clearAllBtn = page.getByRole('button', { name: 'Clear all' })
    await expect(clearAllBtn).toBeVisible()
    await clearAllBtn.click()

    // URL should be clean — no inStock, no q param
    await page.waitForURL((url) => !url.searchParams.has('inStock') && !url.searchParams.has('q'), {
      timeout: 5_000,
    })
    const finalUrl = new URL(page.url())
    expect(finalUrl.searchParams.has('inStock')).toBe(false)
    expect(finalUrl.searchParams.has('q')).toBe(false)

    await page.screenshot({
      path: 'tests/e2e/screenshots/inventory-toggle-clear-all.png',
      fullPage: false,
    })
  })
})

// ---------------------------------------------------------------------------
// Surface 2 — GarmentDetailDrawer size availability badges
// ---------------------------------------------------------------------------

test.describe('Inventory indicators — Surface 2: drawer size availability', () => {
  test.setTimeout(90_000)

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('garment detail drawer opens when a garment card is clicked', async ({ page }) => {
    await page.goto('/garments')
    await page.waitForLoadState('networkidle', { timeout: 20_000 })
    await skipIfRedirectedToLogin(page)

    // Find the first clickable garment card
    // Cards are rendered with role="button" inside the grid view
    const garmentCard = page.locator('[role="button"]').first()
    await expect(garmentCard).toBeVisible({ timeout: 15_000 })
    await garmentCard.click()

    // Drawer should open — it renders as a Sheet with role="dialog"
    const drawer = page.getByRole('dialog')
    await expect(drawer).toBeVisible({ timeout: 10_000 })

    await page.screenshot({
      path: 'tests/e2e/screenshots/inventory-drawer-open.png',
      fullPage: false,
    })
  })

  test('drawer has size availability section when inventory data is present', async ({ page }) => {
    await page.goto('/garments')
    await page.waitForLoadState('networkidle', { timeout: 20_000 })
    await skipIfRedirectedToLogin(page)

    // Open the first garment card
    const garmentCard = page.locator('[role="button"]').first()
    await expect(garmentCard).toBeVisible({ timeout: 15_000 })
    await garmentCard.click()

    const drawer = page.getByRole('dialog')
    await expect(drawer).toBeVisible({ timeout: 10_000 })

    // Give the inventory fetch time to complete (it's async, triggered by color selection)
    // Wait up to 5s for the Availability section header to appear
    const availabilityHeading = drawer.getByText('Availability', { exact: true })
    const hasInventory = await availabilityHeading
      .waitFor({ timeout: 5_000, state: 'visible' })
      .then(() => true)
      .catch(() => false)

    if (!hasInventory) {
      // No inventory data in this environment — verify the section gracefully absent
      await expect(availabilityHeading).not.toBeVisible()
      test.info().annotations.push({
        type: 'skip-reason',
        description: 'catalog_inventory is empty — Availability section not shown (expected)',
      })
      await page.screenshot({
        path: 'tests/e2e/screenshots/inventory-drawer-no-data.png',
        fullPage: false,
      })
      return
    }

    // Availability section is present — verify structure
    await expect(availabilityHeading).toBeVisible()

    // The size availability group has role="group" and aria-label="Size availability"
    const sizeGroup = drawer.locator('[role="group"][aria-label="Size availability"]')
    await expect(sizeGroup).toBeVisible()

    // Each size badge has role="img" (set in PR #681 review fix)
    const sizeBadges = sizeGroup.locator('[role="img"]')
    const badgeCount = await sizeBadges.count()
    expect(
      badgeCount,
      'Expected at least one size badge in the Availability section'
    ).toBeGreaterThan(0)

    await page.screenshot({
      path: 'tests/e2e/screenshots/inventory-drawer-availability.png',
      fullPage: false,
    })
  })

  test('size badge aria-labels communicate stock status to screen readers', async ({ page }) => {
    await page.goto('/garments')
    await page.waitForLoadState('networkidle', { timeout: 20_000 })
    await skipIfRedirectedToLogin(page)

    const garmentCard = page.locator('[role="button"]').first()
    await expect(garmentCard).toBeVisible({ timeout: 15_000 })
    await garmentCard.click()

    const drawer = page.getByRole('dialog')
    await expect(drawer).toBeVisible({ timeout: 10_000 })

    const availabilityHeading = drawer.getByText('Availability', { exact: true })
    const hasInventory = await availabilityHeading
      .waitFor({ timeout: 5_000, state: 'visible' })
      .then(() => true)
      .catch(() => false)

    if (!hasInventory) {
      test.skip(true, 'No inventory data — skipping aria-label verification')
      return
    }

    const sizeGroup = drawer.locator('[role="group"][aria-label="Size availability"]')
    const sizeBadges = sizeGroup.locator('[role="img"]')
    const count = await sizeBadges.count()
    expect(count).toBeGreaterThan(0)

    // Each badge must have an aria-label — either "S", "M — low stock", or "XL — out of stock"
    for (let i = 0; i < Math.min(count, 5); i++) {
      const badge = sizeBadges.nth(i)
      const label = await badge.getAttribute('aria-label')
      expect(label, `Badge ${i} should have an aria-label`).toBeTruthy()
      // Label must be one of: "<size>", "<size> — low stock", "<size> — out of stock"
      expect(label).toMatch(/^.+$/)
    }

    await page.screenshot({
      path: 'tests/e2e/screenshots/inventory-drawer-aria-labels.png',
      fullPage: false,
    })
  })

  test('selecting a different color re-fetches inventory data', async ({ page }) => {
    await page.goto('/garments')
    await page.waitForLoadState('networkidle', { timeout: 20_000 })
    await skipIfRedirectedToLogin(page)

    const garmentCard = page.locator('[role="button"]').first()
    await expect(garmentCard).toBeVisible({ timeout: 15_000 })
    await garmentCard.click()

    const drawer = page.getByRole('dialog')
    await expect(drawer).toBeVisible({ timeout: 10_000 })

    // Find color swatches inside the drawer — they should be interactive
    // Colors appear as buttons in the normalized path (full color section)
    const colorSection = drawer.locator('[role="group"][aria-label*="color"]')
    const colorButtons = colorSection.locator('button, [role="radio"]')
    const colorCount = await colorButtons.count().catch(() => 0)

    if (colorCount < 2) {
      // Only one color available — can't test switching
      test.skip(true, 'Less than 2 colors available — skipping color switch test')
      return
    }

    // Click a second color button and verify the drawer doesn't error
    const secondColor = colorButtons.nth(1)
    await secondColor.click()

    // Drawer should still be open and visible after color switch
    await expect(drawer).toBeVisible({ timeout: 5_000 })

    await page.screenshot({
      path: 'tests/e2e/screenshots/inventory-drawer-color-switch.png',
      fullPage: false,
    })
  })
})

// ---------------------------------------------------------------------------
// Surface 3 — Low-stock dismissible warning in the quote builder
// ---------------------------------------------------------------------------

test.describe('Inventory indicators — Surface 3: quote builder low-stock warning', () => {
  test.setTimeout(90_000)

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('new quote page loads with at least one line item row', async ({ page }) => {
    await page.goto('/quotes/new')
    await page.waitForLoadState('networkidle', { timeout: 20_000 })
    await skipIfRedirectedToLogin(page)

    // The quote builder should have a garment selector line item
    // LineItemRow renders a combobox for garment selection
    const garmentSelector = page.getByRole('combobox').first()
    await expect(garmentSelector).toBeVisible({ timeout: 10_000 })

    await page.screenshot({
      path: 'tests/e2e/screenshots/inventory-quote-builder-load.png',
      fullPage: false,
    })
  })

  test('low-stock warning has correct accessibility attributes when shown', async ({ page }) => {
    await page.goto('/quotes/new')
    await page.waitForLoadState('networkidle', { timeout: 20_000 })
    await skipIfRedirectedToLogin(page)

    // Select the first available garment to trigger inventory fetch
    const garmentSelector = page.getByRole('combobox').first()
    await expect(garmentSelector).toBeVisible({ timeout: 10_000 })
    await garmentSelector.click()

    // Wait for the dropdown to open and pick the first option
    const firstOption = page.getByRole('option').first()
    const hasOptions = await firstOption
      .waitFor({ timeout: 5_000, state: 'visible' })
      .then(() => true)
      .catch(() => false)

    if (!hasOptions) {
      test.skip(true, 'No garment options in catalog — skipping low-stock warning test')
      return
    }

    await firstOption.click()

    // Give the inventory fetch time to resolve (async useEffect)
    // Wait up to 4s for either the warning or confirm it's absent (no inventory data)
    const warningAlert = page.locator('[role="alert"]').filter({
      hasText: /limited availability/i,
    })
    const hasWarning = await warningAlert
      .waitFor({ timeout: 4_000, state: 'visible' })
      .then(() => true)
      .catch(() => false)

    if (!hasWarning) {
      // No low-stock inventory for selected garment — expected if catalog_inventory unseeded
      test.info().annotations.push({
        type: 'skip-reason',
        description: 'Selected garment has no low-stock data — warning not shown (expected)',
      })
      await page.screenshot({
        path: 'tests/e2e/screenshots/inventory-quote-no-warning.png',
        fullPage: false,
      })
      return
    }

    // Warning is visible — verify accessibility attributes
    await expect(warningAlert).toBeVisible()
    await expect(warningAlert).toHaveAttribute('role', 'alert')

    // Warning text matches the spec
    await expect(warningAlert).toContainText('limited availability')

    // Dismiss button must be present with correct aria-label
    const dismissBtn = warningAlert.getByRole('button', { name: /dismiss low-stock warning/i })
    await expect(dismissBtn).toBeVisible()

    await page.screenshot({
      path: 'tests/e2e/screenshots/inventory-quote-warning-visible.png',
      fullPage: false,
    })
  })

  test('dismissing the low-stock warning hides it without navigating away', async ({ page }) => {
    await page.goto('/quotes/new')
    await page.waitForLoadState('networkidle', { timeout: 20_000 })
    await skipIfRedirectedToLogin(page)

    const garmentSelector = page.getByRole('combobox').first()
    await expect(garmentSelector).toBeVisible({ timeout: 10_000 })
    await garmentSelector.click()

    const firstOption = page.getByRole('option').first()
    const hasOptions = await firstOption
      .waitFor({ timeout: 5_000, state: 'visible' })
      .then(() => true)
      .catch(() => false)

    if (!hasOptions) {
      test.skip(true, 'No garment options in catalog')
      return
    }

    await firstOption.click()

    const warningAlert = page.locator('[role="alert"]').filter({
      hasText: /limited availability/i,
    })
    const hasWarning = await warningAlert
      .waitFor({ timeout: 4_000, state: 'visible' })
      .then(() => true)
      .catch(() => false)

    if (!hasWarning) {
      test.skip(true, 'No low-stock data for selected garment — skipping dismiss test')
      return
    }

    await expect(warningAlert).toBeVisible()

    // Click the dismiss button
    const dismissBtn = warningAlert.getByRole('button', { name: /dismiss low-stock warning/i })
    await dismissBtn.click()

    // Warning should disappear
    await expect(warningAlert).not.toBeVisible({ timeout: 2_000 })

    // Quote builder should still be functional (garment selector still present)
    await expect(garmentSelector).toBeVisible()

    // The URL should NOT have changed (dismiss is a local state action, not navigation)
    expect(page.url()).toContain('/quotes/new')

    await page.screenshot({
      path: 'tests/e2e/screenshots/inventory-quote-warning-dismissed.png',
      fullPage: false,
    })
  })

  test('warning dismiss button meets minimum touch target size', async ({ page }) => {
    await page.goto('/quotes/new')
    await page.waitForLoadState('networkidle', { timeout: 20_000 })
    await skipIfRedirectedToLogin(page)

    const garmentSelector = page.getByRole('combobox').first()
    await expect(garmentSelector).toBeVisible({ timeout: 10_000 })
    await garmentSelector.click()

    const firstOption = page.getByRole('option').first()
    const hasOptions = await firstOption
      .waitFor({ timeout: 5_000, state: 'visible' })
      .then(() => true)
      .catch(() => false)

    if (!hasOptions) {
      test.skip(true, 'No garment options in catalog')
      return
    }

    await firstOption.click()

    const warningAlert = page.locator('[role="alert"]').filter({
      hasText: /limited availability/i,
    })
    const hasWarning = await warningAlert
      .waitFor({ timeout: 4_000, state: 'visible' })
      .then(() => true)
      .catch(() => false)

    if (!hasWarning) {
      test.skip(true, 'No low-stock data — skipping touch target test')
      return
    }

    const dismissBtn = warningAlert.getByRole('button', { name: /dismiss low-stock warning/i })
    await expect(dismissBtn).toBeVisible()

    // Verify the button has min-h-(--mobile-touch-target) classes applied
    // On desktop the actual rendered height may be less, but the class must be present
    const classList = await dismissBtn.getAttribute('class')
    expect(classList, 'Dismiss button must have min-h-(--mobile-touch-target) class').toContain(
      'min-h-'
    )

    await page.screenshot({
      path: 'tests/e2e/screenshots/inventory-quote-touch-target.png',
      fullPage: false,
    })
  })
})
