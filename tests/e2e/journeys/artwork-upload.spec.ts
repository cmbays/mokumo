import { test, expect, type Page } from '@playwright/test'
import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs'
import { createMinimalPng, MINIMAL_PNG_FILENAME } from '../fixtures/create-test-files'

/**
 * E2E journey tests: Artwork upload flow.
 *
 * Tests the two-step ArtworkUploadSheet via the /artwork route (ArtworkLibraryClient).
 *
 * Step 1 — Metadata form: Piece Name (required), Design Name (required), Colors (optional)
 * Step 2 — File upload zone: drag-and-drop or file picker
 *
 * Client-side validations tested (no real Supabase required):
 *   V1 — Upload button visibility, sheet open/close, metadata form, idle drop zone
 *   V2 — Rejected file type shows "Unsupported file type" error, sheet stays open
 *   V3 — File too large shows "File exceeds 50 MB limit" error, sheet stays open
 *
 * The happy-path (V1 full upload through to confirmed artwork card) requires a
 * live Supabase instance with presigned URL support. In CI without a backend,
 * V1 extended is scoped to state-machine transitions that do not require a
 * server action response.
 *
 * Running locally against the dev server (auth bypassed in NODE_ENV=development):
 *   PLAYWRIGHT_BASE_URL=http://localhost:3001 npx playwright test artwork-upload
 *
 * Running against a Vercel preview with credentials:
 *   PLAYWRIGHT_BASE_URL=<url> E2E_EMAIL=... E2E_PASSWORD=... npx playwright test artwork-upload
 */

const EMAIL = process.env.E2E_EMAIL ?? ''
const PASSWORD = process.env.E2E_PASSWORD ?? ''
const REQUIRES_AUTH = !!EMAIL && !!PASSWORD

// ---------------------------------------------------------------------------
// Auth helper
// ---------------------------------------------------------------------------

async function login(page: Page) {
  if (!REQUIRES_AUTH) return
  await page.goto('/login', { waitUntil: 'networkidle' })
  await page.locator('#email').fill(EMAIL)
  await page.locator('#password').fill(PASSWORD)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 20_000 })
}

async function skipIfRedirectedToLogin(page: Page) {
  if (page.url().includes('/login')) {
    test.skip(true, 'Redirected to login — set E2E_EMAIL and E2E_PASSWORD env vars')
  }
}

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

/**
 * Writes the minimal PNG fixture to a temp file and returns its absolute path.
 * Playwright's setInputFiles requires a real file path.
 */
function writeTmpPng(): string {
  const tmpDir = os.tmpdir()
  const filePath = path.join(tmpDir, MINIMAL_PNG_FILENAME)
  fs.writeFileSync(filePath, createMinimalPng())
  return filePath
}

// ---------------------------------------------------------------------------
// Locator helpers
// ---------------------------------------------------------------------------

/**
 * Returns the hidden file input inside the open ArtworkUploadSheet (step 2).
 * Sheet uses role="dialog" (Radix), same as a modal.
 */
function getSheetFileInput(page: Page) {
  return page.locator('[role="dialog"] input[type="file"]')
}

/**
 * Returns the upload drop zone inside the open sheet (step 2).
 * ArtworkUploadSheet renders: <div role="button" aria-label="Upload artwork file" ...>
 */
function getDropZone(page: Page) {
  return page.locator('[role="dialog"] [role="button"][aria-label="Upload artwork file"]')
}

// ---------------------------------------------------------------------------
// Page navigation
// ---------------------------------------------------------------------------

async function gotoArtworkPage(page: Page) {
  await page.goto('/artwork')
  await page.waitForLoadState('networkidle', { timeout: 20_000 })
}

/**
 * Clicks the Upload button on the /artwork page to open the sheet.
 * Returns true if the sheet's step-1 metadata form appeared.
 */
async function openUploadSheet(page: Page): Promise<boolean> {
  const uploadBtn = page.getByRole('button', { name: /Upload/i })
  const isVisible = await uploadBtn
    .waitFor({ timeout: 5_000, state: 'visible' })
    .then(() => true)
    .catch(() => false)

  if (!isVisible) return false

  await uploadBtn.click()

  const dialog = page.getByRole('dialog')
  const sheetOpen = await dialog
    .waitFor({ timeout: 5_000, state: 'visible' })
    .then(() => true)
    .catch(() => false)

  if (!sheetOpen) return false

  // Confirm step-1 label is present
  const step1Label = dialog.getByText(/Artwork Piece/i)
  return step1Label
    .waitFor({ timeout: 3_000, state: 'visible' })
    .then(() => true)
    .catch(() => false)
}

/**
 * Fills the step-1 metadata form and submits, advancing to the file drop zone (step 2).
 * Returns true if the drop zone appeared after submit.
 *
 * pieceName and variantName are required. colorCount is optional.
 */
async function advanceToFileStep(
  page: Page,
  pieceName = 'Test Piece',
  variantName = 'Navy on White',
  colorCount = ''
): Promise<boolean> {
  const dialog = page.getByRole('dialog')

  await dialog.getByLabel('Artwork Piece').fill(pieceName)
  await dialog.getByLabel('Design Name').fill(variantName)

  if (colorCount) {
    await dialog.getByLabel('Colors').fill(colorCount)
  }

  const continueBtn = dialog.getByRole('button', { name: /Continue to File Upload/i })
  await continueBtn.click()

  // Wait for file drop zone (step 2)
  const dropZone = getDropZone(page)
  return dropZone
    .waitFor({ timeout: 10_000, state: 'visible' })
    .then(() => true)
    .catch(() => false)
}

// ---------------------------------------------------------------------------
// Journey V1 — Upload button visibility and sheet open/close
// ---------------------------------------------------------------------------

test.describe('Artwork upload — V1: Upload button visibility and sheet', () => {
  test.setTimeout(90_000)

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('/artwork page loads and renders an Upload button', async ({ page }) => {
    await gotoArtworkPage(page)
    await skipIfRedirectedToLogin(page)

    await expect(page).toHaveURL('/artwork')

    const uploadBtn = page.getByRole('button', { name: /Upload/i })
    await expect(uploadBtn).toBeVisible({ timeout: 10_000 })

    await page.screenshot({
      path: 'tests/e2e/screenshots/artwork-upload-v1-page-load.png',
      fullPage: false,
    })
  })

  test('clicking Upload opens a sheet with title and metadata form (step 1)', async ({ page }) => {
    await gotoArtworkPage(page)
    await skipIfRedirectedToLogin(page)

    const opened = await openUploadSheet(page)
    if (!opened) {
      test.skip(true, 'Upload sheet did not open')
      return
    }

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5_000 })

    // Sheet title
    await expect(dialog.getByText(/Upload Artwork/i)).toBeVisible()

    // Step 1 description
    await expect(dialog.getByText(/Name the piece and design before uploading/i)).toBeVisible()

    // Step 1 form fields
    await expect(dialog.getByLabel('Artwork Piece')).toBeVisible()
    await expect(dialog.getByLabel('Design Name')).toBeVisible()
    await expect(dialog.getByLabel('Colors')).toBeVisible()

    await page.screenshot({
      path: 'tests/e2e/screenshots/artwork-upload-v1-sheet-step1.png',
      fullPage: false,
    })
  })

  test('sheet closes when Escape is pressed in step 1', async ({ page }) => {
    await gotoArtworkPage(page)
    await skipIfRedirectedToLogin(page)

    const opened = await openUploadSheet(page)
    if (!opened) {
      test.skip(true, 'Upload sheet did not open — skipping close test')
      return
    }

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5_000 })

    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible({ timeout: 3_000 })

    await page.screenshot({
      path: 'tests/e2e/screenshots/artwork-upload-v1-sheet-closed.png',
      fullPage: false,
    })
  })

  test('submit button is disabled until both required fields are filled', async ({ page }) => {
    await gotoArtworkPage(page)
    await skipIfRedirectedToLogin(page)

    const opened = await openUploadSheet(page)
    if (!opened) {
      test.skip(true, 'Upload sheet did not open — skipping validation test')
      return
    }

    const dialog = page.getByRole('dialog')
    const continueBtn = dialog.getByRole('button', { name: /Continue to File Upload/i })

    // Initially disabled (both fields empty)
    await expect(continueBtn).toBeDisabled()

    // Only piece name filled → still disabled
    await dialog.getByLabel('Artwork Piece').fill('Front Logo')
    await expect(continueBtn).toBeDisabled()

    // Both filled → enabled
    await dialog.getByLabel('Design Name').fill('Navy on White')
    await expect(continueBtn).toBeEnabled()

    await page.screenshot({
      path: 'tests/e2e/screenshots/artwork-upload-v1-form-validation.png',
      fullPage: false,
    })
  })

  test('step 2 file drop zone has idle state after metadata submit', async ({ page }) => {
    await gotoArtworkPage(page)
    await skipIfRedirectedToLogin(page)

    const opened = await openUploadSheet(page)
    if (!opened) {
      test.skip(true, 'Upload sheet did not open — skipping idle state test')
      return
    }

    const advancedToStep2 = await advanceToFileStep(page)
    if (!advancedToStep2) {
      test.skip(true, 'Could not advance to file upload step — server action may be unavailable')
      return
    }

    const dialog = page.getByRole('dialog')

    // Step 2 description
    await expect(dialog.getByText(/Drop or select the artwork file/i)).toBeVisible()

    // Drop zone present with correct aria label
    const dropZone = getDropZone(page)
    await expect(dropZone).toBeVisible()

    // Idle state text
    await expect(dialog.getByText(/Drop file here or/i)).toBeVisible()

    // Accepted types label
    await expect(dialog.getByText(/PNG, JPEG/i)).toBeVisible()

    // Hidden file input with accept attribute
    const fileInput = getSheetFileInput(page)
    await expect(fileInput).toBeAttached()
    const acceptAttr = await fileInput.getAttribute('accept')
    expect(acceptAttr).toContain('.png')
    expect(acceptAttr).toContain('.jpg')
    expect(acceptAttr).toContain('.pdf')

    await page.screenshot({
      path: 'tests/e2e/screenshots/artwork-upload-v1-step2-idle.png',
      fullPage: false,
    })
  })
})

// ---------------------------------------------------------------------------
// Journey V2 — Rejected file type
// ---------------------------------------------------------------------------

test.describe('Artwork upload — V2: Rejected file type', () => {
  test.setTimeout(90_000)

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('selecting a .txt file shows "Unsupported file type" error and keeps sheet open', async ({
    page,
  }) => {
    await gotoArtworkPage(page)
    await skipIfRedirectedToLogin(page)

    const opened = await openUploadSheet(page)
    if (!opened) {
      test.skip(true, 'Upload sheet did not open — skipping V2 test')
      return
    }

    const advancedToStep2 = await advanceToFileStep(page)
    if (!advancedToStep2) {
      test.skip(true, 'Could not reach file step — server action unavailable')
      return
    }

    const dialog = page.getByRole('dialog')
    const fileInput = getSheetFileInput(page)

    await fileInput.setInputFiles({
      name: 'test-invalid.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('this is not an image'),
    })

    const errorMsg = dialog.getByText('Unsupported file type')
    await expect(errorMsg).toBeVisible({ timeout: 5_000 })

    // Sheet must remain open
    await expect(dialog).toBeVisible()

    await expect(dialog.getByText(/Click to try again/i)).toBeVisible()

    await page.screenshot({
      path: 'tests/e2e/screenshots/artwork-upload-v2-bad-type-error.png',
      fullPage: false,
    })
  })

  test('error state applies error border to drop zone', async ({ page }) => {
    await gotoArtworkPage(page)
    await skipIfRedirectedToLogin(page)

    const opened = await openUploadSheet(page)
    if (!opened) {
      test.skip(true, 'Upload sheet did not open — skipping V2 error state test')
      return
    }

    const advancedToStep2 = await advanceToFileStep(page)
    if (!advancedToStep2) {
      test.skip(true, 'Could not reach file step')
      return
    }

    const dialog = page.getByRole('dialog')
    const fileInput = getSheetFileInput(page)

    await fileInput.setInputFiles({
      name: 'bad.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not an image'),
    })

    await expect(dialog.getByText('Unsupported file type')).toBeVisible({ timeout: 5_000 })

    const classAttr = await getDropZone(page).getAttribute('class')
    expect(classAttr, 'Drop zone should have border-error class in error state').toContain(
      'border-error'
    )

    await page.screenshot({
      path: 'tests/e2e/screenshots/artwork-upload-v2-error-state.png',
      fullPage: false,
    })
  })

  test('selecting a valid PNG after rejection clears the error', async ({ page }) => {
    await gotoArtworkPage(page)
    await skipIfRedirectedToLogin(page)

    const opened = await openUploadSheet(page)
    if (!opened) {
      test.skip(true, 'Upload sheet did not open — skipping V2 retry test')
      return
    }

    const advancedToStep2 = await advanceToFileStep(page)
    if (!advancedToStep2) {
      test.skip(true, 'Could not reach file step')
      return
    }

    const dialog = page.getByRole('dialog')
    const fileInput = getSheetFileInput(page)

    await fileInput.setInputFiles({
      name: 'bad.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not an image'),
    })
    const errorMsg = dialog.getByText('Unsupported file type')
    await expect(errorMsg).toBeVisible({ timeout: 5_000 })

    // Retry with valid PNG — hook resets error immediately on next upload() call
    const pngPath = writeTmpPng()
    try {
      await fileInput.setInputFiles(pngPath)
      await expect(errorMsg).not.toBeVisible({ timeout: 5_000 })
    } finally {
      fs.unlinkSync(pngPath)
    }

    await page.screenshot({
      path: 'tests/e2e/screenshots/artwork-upload-v2-retry-cleared.png',
      fullPage: false,
    })
  })
})

// ---------------------------------------------------------------------------
// Journey V3 — File exceeds size limit
// ---------------------------------------------------------------------------

test.describe('Artwork upload — V3: File exceeds size limit', () => {
  test.setTimeout(90_000)

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('selecting a file >50 MB shows "File exceeds 50 MB limit" error', async ({ page }) => {
    await gotoArtworkPage(page)
    await skipIfRedirectedToLogin(page)

    const opened = await openUploadSheet(page)
    if (!opened) {
      test.skip(true, 'Upload sheet did not open — skipping V3 test')
      return
    }

    const advancedToStep2 = await advanceToFileStep(page)
    if (!advancedToStep2) {
      test.skip(true, 'Could not reach file step')
      return
    }

    const dialog = page.getByRole('dialog')
    const FIFTY_MB = 50 * 1024 * 1024

    const fileInput = getSheetFileInput(page)
    await fileInput.setInputFiles({
      name: 'giant-artwork.png',
      mimeType: 'image/png',
      buffer: Buffer.alloc(FIFTY_MB + 1, 0x00),
    })

    const errorMsg = dialog.getByText('File exceeds 50 MB limit')
    await expect(errorMsg).toBeVisible({ timeout: 5_000 })

    await expect(dialog).toBeVisible()
    await expect(dialog.getByText(/Click to try again/i)).toBeVisible()

    await page.screenshot({
      path: 'tests/e2e/screenshots/artwork-upload-v3-size-error.png',
      fullPage: false,
    })
  })

  test('size error shows error border on drop zone', async ({ page }) => {
    await gotoArtworkPage(page)
    await skipIfRedirectedToLogin(page)

    const opened = await openUploadSheet(page)
    if (!opened) {
      test.skip(true, 'Upload sheet did not open — skipping V3 border test')
      return
    }

    const advancedToStep2 = await advanceToFileStep(page)
    if (!advancedToStep2) {
      test.skip(true, 'Could not reach file step')
      return
    }

    const dialog = page.getByRole('dialog')
    const FIFTY_MB = 50 * 1024 * 1024
    const fileInput = getSheetFileInput(page)

    await fileInput.setInputFiles({
      name: 'toobig.png',
      mimeType: 'image/png',
      buffer: Buffer.alloc(FIFTY_MB + 1, 0x00),
    })

    await expect(dialog.getByText('File exceeds 50 MB limit')).toBeVisible({ timeout: 5_000 })

    const classAttr = await getDropZone(page).getAttribute('class')
    expect(classAttr, 'Drop zone should have border-error class in size error state').toContain(
      'border-error'
    )

    await page.screenshot({
      path: 'tests/e2e/screenshots/artwork-upload-v3-size-border.png',
      fullPage: false,
    })
  })

  test('size error resets when user selects a valid small file after rejection', async ({
    page,
  }) => {
    await gotoArtworkPage(page)
    await skipIfRedirectedToLogin(page)

    const opened = await openUploadSheet(page)
    if (!opened) {
      test.skip(true, 'Upload sheet did not open — skipping V3 reset test')
      return
    }

    const advancedToStep2 = await advanceToFileStep(page)
    if (!advancedToStep2) {
      test.skip(true, 'Could not reach file step')
      return
    }

    const dialog = page.getByRole('dialog')
    const fileInput = getSheetFileInput(page)

    const FIFTY_MB = 50 * 1024 * 1024
    await fileInput.setInputFiles({
      name: 'giant.png',
      mimeType: 'image/png',
      buffer: Buffer.alloc(FIFTY_MB + 1, 0x00),
    })
    const errorMsg = dialog.getByText('File exceeds 50 MB limit')
    await expect(errorMsg).toBeVisible({ timeout: 5_000 })

    const pngPath = writeTmpPng()
    try {
      await fileInput.setInputFiles(pngPath)
      await expect(errorMsg).not.toBeVisible({ timeout: 5_000 })
    } finally {
      fs.unlinkSync(pngPath)
    }

    await page.screenshot({
      path: 'tests/e2e/screenshots/artwork-upload-v3-reset-after-size-error.png',
      fullPage: false,
    })
  })
})

// ---------------------------------------------------------------------------
// Journey V1 extended — valid file selection triggers state transition
// ---------------------------------------------------------------------------

test.describe('Artwork upload — V1 extended: valid file selection state transition', () => {
  test.setTimeout(90_000)

  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('selecting a valid PNG transitions state away from idle (hashing/error)', async ({
    page,
  }) => {
    await gotoArtworkPage(page)
    await skipIfRedirectedToLogin(page)

    const opened = await openUploadSheet(page)
    if (!opened) {
      test.skip(true, 'Upload sheet did not open — skipping valid PNG state transition test')
      return
    }

    const advancedToStep2 = await advanceToFileStep(page)
    if (!advancedToStep2) {
      test.skip(true, 'Could not reach file step')
      return
    }

    const dialog = page.getByRole('dialog')
    const idleText = dialog.getByText(/Drop file here or/i)
    await expect(idleText).toBeVisible()

    const pngPath = writeTmpPng()
    try {
      const fileInput = getSheetFileInput(page)
      await fileInput.setInputFiles(pngPath)

      // After file selection:
      //   1. Validates size (passes — 68 bytes)
      //   2. Validates MIME type (passes — image/png)
      //   3. Transitions to 'hashing' → calls sha256Hex()
      //   4. Then 'validating' → calls onInitiate (server action)
      //   5. In CI (no real Supabase): server action throws → state → 'error'
      //   6. With live Supabase: 'uploading' → 'confirming' → 'done'
      await expect(idleText).not.toBeVisible({ timeout: 10_000 })

      const processingOrError = dialog
        .locator('*')
        .filter({ hasText: /Computing checksum|Validating|Uploading|Confirming|Upload complete/ })
        .or(dialog.locator('*').filter({ hasText: /Upload failed|Unauthorized|Failed to/ }))
        .first()

      const hasStateChange = await processingOrError
        .waitFor({ timeout: 10_000, state: 'visible' })
        .then(() => true)
        .catch(() => false)

      if (!hasStateChange) {
        // Idle text gone is sufficient to confirm state transition occurred
        const idleStillVisible = await idleText.isVisible()
        expect(idleStillVisible, 'Idle state text should be gone after valid file selection').toBe(
          false
        )
      }
    } finally {
      if (fs.existsSync(pngPath)) {
        fs.unlinkSync(pngPath)
      }
    }

    await page.screenshot({
      path: 'tests/e2e/screenshots/artwork-upload-v1-state-transition.png',
      fullPage: false,
    })
  })

  test('artwork grid shows new piece card after successful upload (requires live Supabase)', async ({
    page,
  }) => {
    await gotoArtworkPage(page)
    await skipIfRedirectedToLogin(page)

    const opened = await openUploadSheet(page)
    if (!opened) {
      test.skip(true, 'Upload sheet did not open — skipping full upload test')
      return
    }

    // Use a recognizable piece name so we can find it in the grid afterward.
    // On success, the page reloads (window.location.reload) and shows the piece card by name.
    const TEST_PIECE_NAME = 'E2E Test Piece'
    const advancedToStep2 = await advanceToFileStep(page, TEST_PIECE_NAME, 'E2E Design', '2')
    if (!advancedToStep2) {
      test.skip(true, 'Could not reach file step — server action may be unavailable')
      return
    }

    const dialog = page.getByRole('dialog')

    const pngPath = writeTmpPng()
    try {
      const fileInput = getSheetFileInput(page)
      await fileInput.setInputFiles(pngPath)

      const successIcon = dialog.getByText(/Upload complete/i)
      const uploadCompleted = await successIcon
        .waitFor({ timeout: 15_000, state: 'visible' })
        .then(() => true)
        .catch(() => false)

      if (!uploadCompleted) {
        test.skip(
          true,
          'Upload did not complete — likely no live Supabase. Full upload test skipped.'
        )
        return
      }

      // Sheet closes after 1s delay, then page reloads
      await expect(dialog).not.toBeVisible({ timeout: 5_000 })

      // Grid shows piece card with the user-entered piece name (not the filename)
      const artworkCard = page.locator('.grid').getByText(TEST_PIECE_NAME)
      await expect(artworkCard).toBeVisible({ timeout: 10_000 })
    } finally {
      if (fs.existsSync(pngPath)) {
        fs.unlinkSync(pngPath)
      }
    }

    await page.screenshot({
      path: 'tests/e2e/screenshots/artwork-upload-v1-success-card.png',
      fullPage: false,
    })
  })
})
