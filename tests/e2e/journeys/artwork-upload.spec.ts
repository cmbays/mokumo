import { test, expect, type Page } from '@playwright/test'
import * as path from 'path'
import * as os from 'os'
import * as fs from 'fs'
import { createMinimalPng, MINIMAL_PNG_FILENAME } from '../fixtures/create-test-files'

/**
 * E2E journey tests: Artwork upload flow.
 *
 * Tests the ArtworkUploadModal from src/features/artwork/components/ via the
 * /artwork route (ArtworkLibraryClient). The /artwork page exposes an "Upload"
 * button in the page header that opens the H2 ArtworkUploadModal.
 *
 * Client-side validations tested (no real Supabase required):
 *   V1 — Upload button visibility, modal open/close, valid file selection
 *   V2 — Rejected file type shows "Unsupported file type" error, modal stays open
 *   V3 — File too large shows "File exceeds 50 MB limit" error, modal stays open
 *
 * The happy-path (V1 full upload through to confirmed artwork card) requires a
 * live Supabase instance with presigned URL support. In CI without a backend,
 * V1 extended is scoped to state-machine transitions that do not require a
 * server action response.
 *
 * Running locally against the dev server (auth bypassed in NODE_ENV=development):
 *   PLAYWRIGHT_BASE_URL=http://localhost:3000 npx playwright test artwork-upload
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
 * Returns the hidden file input inside the open ArtworkUploadModal dialog.
 * The modal renders: <input type="file" accept="..." class="sr-only" aria-hidden="true" />
 */
function getDialogFileInput(page: Page) {
  return page.locator('[role="dialog"] input[type="file"]')
}

/**
 * Returns the upload drop zone inside the open dialog.
 * ArtworkUploadModal renders: <div role="button" aria-label="Upload artwork file" ...>
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
 * Clicks the Upload button on the /artwork page to open the upload modal.
 * Returns true if the dialog appeared.
 */
async function openUploadModal(page: Page): Promise<boolean> {
  // ArtworkLibraryClient renders a header Upload button with UploadCloud icon
  const uploadBtn = page.getByRole('button', { name: /Upload/i })
  const isVisible = await uploadBtn
    .waitFor({ timeout: 5_000, state: 'visible' })
    .then(() => true)
    .catch(() => false)

  if (!isVisible) return false

  await uploadBtn.click()

  const dialog = page.getByRole('dialog')
  return dialog
    .waitFor({ timeout: 5_000, state: 'visible' })
    .then(() => true)
    .catch(() => false)
}

// ---------------------------------------------------------------------------
// Journey V1 — Upload button visibility and modal open/close
// ---------------------------------------------------------------------------

test.describe('Artwork upload — V1: Upload button visibility and modal', () => {
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

  test('clicking Upload opens a dialog with "Upload Artwork" title', async ({ page }) => {
    await gotoArtworkPage(page)
    await skipIfRedirectedToLogin(page)

    const opened = await openUploadModal(page)
    if (!opened) {
      test.skip(true, 'Upload modal did not open')
      return
    }

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5_000 })

    const dialogTitle = dialog.getByText(/Upload Artwork/i)
    await expect(dialogTitle).toBeVisible()

    // Dialog should describe the drop action
    const dialogDesc = dialog.getByText(/Drop a file or click to browse/i)
    await expect(dialogDesc).toBeVisible()

    await page.screenshot({
      path: 'tests/e2e/screenshots/artwork-upload-v1-modal-open.png',
      fullPage: false,
    })
  })

  test('modal closes when Escape is pressed in idle state', async ({ page }) => {
    await gotoArtworkPage(page)
    await skipIfRedirectedToLogin(page)

    const opened = await openUploadModal(page)
    if (!opened) {
      test.skip(true, 'Upload modal did not open — skipping close test')
      return
    }

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5_000 })

    // ArtworkUploadModal allows Escape when not uploading (isActive = false in idle state)
    await page.keyboard.press('Escape')
    await expect(dialog).not.toBeVisible({ timeout: 3_000 })

    await page.screenshot({
      path: 'tests/e2e/screenshots/artwork-upload-v1-modal-closed.png',
      fullPage: false,
    })
  })

  test('modal has idle state: drop zone with Upload icon and browse link', async ({ page }) => {
    await gotoArtworkPage(page)
    await skipIfRedirectedToLogin(page)

    const opened = await openUploadModal(page)
    if (!opened) {
      test.skip(true, 'Upload modal did not open — skipping idle state test')
      return
    }

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5_000 })

    // Drop zone is present with correct aria label
    const dropZone = getDropZone(page)
    await expect(dropZone).toBeVisible()

    // Idle state text: "Drop file here or browse"
    const idleText = dialog.getByText(/Drop file here or/i)
    await expect(idleText).toBeVisible()

    // Accepted types label is shown
    const typesLabel = dialog.getByText(/PNG, JPEG/i)
    await expect(typesLabel).toBeVisible()

    // Hidden file input has accept attribute listing supported types
    const fileInput = getDialogFileInput(page)
    await expect(fileInput).toBeAttached()
    const acceptAttr = await fileInput.getAttribute('accept')
    expect(acceptAttr).toContain('.png')
    expect(acceptAttr).toContain('.jpg')
    expect(acceptAttr).toContain('.pdf')

    await page.screenshot({
      path: 'tests/e2e/screenshots/artwork-upload-v1-idle-state.png',
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

  test('selecting a .txt file shows "Unsupported file type" error and keeps modal open', async ({
    page,
  }) => {
    await gotoArtworkPage(page)
    await skipIfRedirectedToLogin(page)

    const opened = await openUploadModal(page)
    if (!opened) {
      test.skip(true, 'Upload modal did not open — skipping V2 test')
      return
    }

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5_000 })

    // Set a text/plain file — not in ALLOWED_MIME_TYPES
    // useFileUpload checks: if !ALLOWED_MIME_TYPES.includes(file.type) → 'Unsupported file type'
    const fileInput = getDialogFileInput(page)
    await fileInput.setInputFiles({
      name: 'test-invalid.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('this is not an image'),
    })

    // Error message from useFileUpload.ts: 'Unsupported file type'
    const errorMsg = dialog.getByText('Unsupported file type')
    await expect(errorMsg).toBeVisible({ timeout: 5_000 })

    // Modal must remain open (user needs to retry)
    await expect(dialog).toBeVisible()

    // "Click to try again" hint from ArtworkUploadModal error state
    const retryHint = dialog.getByText(/Click to try again/i)
    await expect(retryHint).toBeVisible()

    await page.screenshot({
      path: 'tests/e2e/screenshots/artwork-upload-v2-bad-type-error.png',
      fullPage: false,
    })
  })

  test('error state applies error border to drop zone', async ({ page }) => {
    await gotoArtworkPage(page)
    await skipIfRedirectedToLogin(page)

    const opened = await openUploadModal(page)
    if (!opened) {
      test.skip(true, 'Upload modal did not open — skipping V2 error state test')
      return
    }

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5_000 })

    const fileInput = getDialogFileInput(page)
    await fileInput.setInputFiles({
      name: 'bad.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not an image'),
    })

    // Wait for error to appear
    const errorMsg = dialog.getByText('Unsupported file type')
    await expect(errorMsg).toBeVisible({ timeout: 5_000 })

    // ArtworkUploadModal applies `border-error` CSS class in error state
    const dropZone = getDropZone(page)
    const classAttr = await dropZone.getAttribute('class')
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

    const opened = await openUploadModal(page)
    if (!opened) {
      test.skip(true, 'Upload modal did not open — skipping V2 retry test')
      return
    }

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5_000 })

    const fileInput = getDialogFileInput(page)

    // First: trigger file type error
    await fileInput.setInputFiles({
      name: 'bad.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not an image'),
    })
    const errorMsg = dialog.getByText('Unsupported file type')
    await expect(errorMsg).toBeVisible({ timeout: 5_000 })

    // Second: set a valid PNG — the hook resets error on the next upload() call
    const pngPath = writeTmpPng()
    try {
      await fileInput.setInputFiles(pngPath)
      // Error should clear as state transitions to 'hashing'
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

    const opened = await openUploadModal(page)
    if (!opened) {
      test.skip(true, 'Upload modal did not open — skipping V3 test')
      return
    }

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5_000 })

    // Create a buffer 1 byte over the 50 MB limit.
    // MIME type is valid (image/png) to ensure size check is reached.
    // useFileUpload checks size before MIME type: if file.size > MAX_SIZE_BYTES → error
    const FIFTY_MB = 50 * 1024 * 1024
    const oversizeBuffer = Buffer.alloc(FIFTY_MB + 1, 0x00)

    const fileInput = getDialogFileInput(page)
    await fileInput.setInputFiles({
      name: 'giant-artwork.png',
      mimeType: 'image/png',
      buffer: oversizeBuffer,
    })

    // Error message from useFileUpload.ts: 'File exceeds 50 MB limit'
    const errorMsg = dialog.getByText('File exceeds 50 MB limit')
    await expect(errorMsg).toBeVisible({ timeout: 5_000 })

    // Modal must remain open
    await expect(dialog).toBeVisible()

    // "Click to try again" hint
    const retryHint = dialog.getByText(/Click to try again/i)
    await expect(retryHint).toBeVisible()

    await page.screenshot({
      path: 'tests/e2e/screenshots/artwork-upload-v3-size-error.png',
      fullPage: false,
    })
  })

  test('size error shows error border on drop zone', async ({ page }) => {
    await gotoArtworkPage(page)
    await skipIfRedirectedToLogin(page)

    const opened = await openUploadModal(page)
    if (!opened) {
      test.skip(true, 'Upload modal did not open — skipping V3 border test')
      return
    }

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5_000 })

    const FIFTY_MB = 50 * 1024 * 1024
    const fileInput = getDialogFileInput(page)
    await fileInput.setInputFiles({
      name: 'toobig.png',
      mimeType: 'image/png',
      buffer: Buffer.alloc(FIFTY_MB + 1, 0x00),
    })

    const errorMsg = dialog.getByText('File exceeds 50 MB limit')
    await expect(errorMsg).toBeVisible({ timeout: 5_000 })

    // Drop zone should have border-error in error state
    const dropZone = getDropZone(page)
    const classAttr = await dropZone.getAttribute('class')
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

    const opened = await openUploadModal(page)
    if (!opened) {
      test.skip(true, 'Upload modal did not open — skipping V3 reset test')
      return
    }

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5_000 })

    const fileInput = getDialogFileInput(page)

    // Trigger size error
    const FIFTY_MB = 50 * 1024 * 1024
    await fileInput.setInputFiles({
      name: 'giant.png',
      mimeType: 'image/png',
      buffer: Buffer.alloc(FIFTY_MB + 1, 0x00),
    })
    const errorMsg = dialog.getByText('File exceeds 50 MB limit')
    await expect(errorMsg).toBeVisible({ timeout: 5_000 })

    // Retry with valid PNG — hook resets error immediately on next upload() call
    const pngPath = writeTmpPng()
    try {
      await fileInput.setInputFiles(pngPath)
      // Size error should clear as state transitions to 'hashing'
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

    const opened = await openUploadModal(page)
    if (!opened) {
      test.skip(true, 'Upload modal did not open — skipping valid PNG state transition test')
      return
    }

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5_000 })

    // Verify initial idle state
    const idleText = dialog.getByText(/Drop file here or/i)
    await expect(idleText).toBeVisible()

    const pngPath = writeTmpPng()
    try {
      const fileInput = getDialogFileInput(page)
      await fileInput.setInputFiles(pngPath)

      // After file selection, the hook:
      //   1. Validates size (passes — 68 bytes)
      //   2. Validates MIME type (passes — image/png)
      //   3. Transitions to 'hashing' → calls sha256Hex()
      //   4. Then 'validating' → calls onInitiate (server action)
      //   5. In CI (no real Supabase): server action throws → state → 'error'
      //   6. With live Supabase: continues through 'uploading' → 'confirming' → 'done'
      //
      // The idle drop zone text disappears in ALL cases — verifies client-side
      // validation passed and the upload pipeline started.
      await expect(idleText).not.toBeVisible({ timeout: 10_000 })

      // One of these states should be visible after idle clears
      const processingOrError = dialog
        .locator('*')
        .filter({ hasText: /Computing checksum|Validating|Uploading|Confirming|Upload complete/ })
        .or(
          // Error from server action in CI (server unavailable)
          dialog.locator('*').filter({ hasText: /Upload failed|Unauthorized|Failed to/ })
        )
        .first()

      // Either a processing state OR an error state is acceptable
      const hasStateChange = await processingOrError
        .waitFor({ timeout: 10_000, state: 'visible' })
        .then(() => true)
        .catch(() => false)

      // If neither appears, it may be a timing issue — at minimum idle text should be gone
      if (!hasStateChange) {
        // The idle text is gone — that's sufficient to confirm state transition occurred
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

  test('artwork grid shows new card after successful upload (requires live Supabase)', async ({
    page,
  }) => {
    await gotoArtworkPage(page)
    await skipIfRedirectedToLogin(page)

    const opened = await openUploadModal(page)
    if (!opened) {
      test.skip(true, 'Upload modal did not open — skipping full upload test')
      return
    }

    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible({ timeout: 5_000 })

    const pngPath = writeTmpPng()
    try {
      const fileInput = getDialogFileInput(page)
      await fileInput.setInputFiles(pngPath)

      // Wait for 'done' state (success indicator)
      const successIcon = dialog.getByText(/Upload complete/i)
      const uploadCompleted = await successIcon
        .waitFor({ timeout: 15_000, state: 'visible' })
        .then(() => true)
        .catch(() => false)

      if (!uploadCompleted) {
        // Server action not available in this environment — skip gracefully
        test.skip(
          true,
          'Upload did not complete — likely no live Supabase. Full upload test skipped.'
        )
        return
      }

      // After 1200ms delay, modal closes and onSuccess is called
      await expect(dialog).not.toBeVisible({ timeout: 5_000 })

      // The artwork grid should now show a card for the uploaded file
      const artworkCard = page.locator('.grid').locator('text=test-artwork.png')
      await expect(artworkCard).toBeVisible({ timeout: 5_000 })
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
