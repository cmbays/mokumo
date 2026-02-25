import { test, expect } from '@playwright/test'

/**
 * Smoke test: verify garment catalog images load as real S&S CDN photos.
 *
 * Requires E2E_EMAIL + E2E_PASSWORD env vars when running against a production
 * deployment (auth enforced). Set via `.env.test` or the shell before running.
 *
 * Example:
 *   E2E_EMAIL=test@example.com E2E_PASSWORD=secret \
 *   PLAYWRIGHT_BASE_URL=https://print-4ink.vercel.app \
 *   npx playwright test garment-images
 */

const EMAIL = process.env.E2E_EMAIL ?? ''
const PASSWORD = process.env.E2E_PASSWORD ?? ''
const REQUIRES_AUTH = !!EMAIL && !!PASSWORD

test.describe('Garment catalog images', () => {
  test.beforeEach(async ({ page }) => {
    if (!REQUIRES_AUTH) return

    await page.goto('/login', { waitUntil: 'networkidle' })
    await page.screenshot({ path: 'tests/e2e/screenshots/login-page.png' })
    await page.locator('#email').fill(EMAIL)
    await page.locator('#password').fill(PASSWORD)
    await page.locator('button[type="submit"]').click()
    // Wait a moment then screenshot to see any error message
    await page.waitForTimeout(3000)
    await page.screenshot({ path: 'tests/e2e/screenshots/login-after-submit.png' })
    // Wait for redirect away from login
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20_000 })
  })

  test('garment cards show real S&S CDN images, not SVG placeholders', async ({ page }) => {
    await page.goto('/garments')

    // Wait for page content to load
    await page.waitForLoadState('networkidle', { timeout: 20_000 })

    // Screenshot for visual inspection
    await page.screenshot({
      path: 'tests/e2e/screenshots/garment-catalog.png',
      fullPage: false,
    })

    // Log all img srcs for debugging (Next.js optimizes external URLs through /_next/image?url=...)
    const allImgs = await page.locator('img').evaluateAll((imgs) =>
      imgs.map((img) => ({
        src: (img as HTMLImageElement).src,
        naturalWidth: (img as HTMLImageElement).naturalWidth,
        complete: (img as HTMLImageElement).complete,
      }))
    )

    console.log('All images on page:')
    allImgs.forEach((img) => {
      console.log(
        `  src=${img.src.slice(0, 120)} naturalWidth=${img.naturalWidth} complete=${img.complete}`
      )
    })

    // Next.js serves external images through /_next/image?url=encoded_url
    // So we match on the encoded ssactivewear.com URL in the query string
    const ssImages = page.locator('img[src*="ssactivewear"]')
    const count = await ssImages.count()

    console.log(`S&S CDN images (direct or via /_next/image): ${count}`)

    expect(
      count,
      `No S&S images found. All srcs:\n${allImgs.map((i) => i.src).join('\n')}`
    ).toBeGreaterThan(0)

    // Verify at least one image decoded (naturalWidth > 0)
    const loadedCount = allImgs.filter(
      (i) => i.src.includes('ssactivewear') && i.naturalWidth > 0
    ).length

    console.log(`S&S images that decoded successfully: ${loadedCount}`)
    expect(loadedCount, 'S&S image URLs exist but none decoded — 404 or CORS?').toBeGreaterThan(0)
  })

  test('screenshot garment catalog for visual inspection', async ({ page }) => {
    await page.goto('/garments')
    await page.waitForLoadState('networkidle', { timeout: 20_000 })
    await page.screenshot({
      path: 'tests/e2e/screenshots/garment-catalog-full.png',
      fullPage: false,
    })
    // This test always passes — screenshot is the artifact for manual review
  })
})
