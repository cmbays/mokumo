/**
 * Image sync script — fetches all product data from S&S and populates
 * catalog_colors + catalog_images in Supabase.
 *
 * Run after catalog sync (run-catalog-sync.ts) since it depends on catalog_styles.
 *
 * Usage:
 *   npx tsx -r ./scripts/mock-server-only.cjs scripts/run-image-sync.ts
 */
import dotenv from 'dotenv'
import { existsSync } from 'fs'
import { z } from 'zod'
import { sql } from 'drizzle-orm'

if (existsSync('.env.local')) dotenv.config({ path: '.env.local', override: false })

const SS_IMAGE_BASE = 'https://www.ssactivewear.com'

const ssProductSchema = z
  .object({
    sku: z.string(),
    styleID: z.union([z.number(), z.string()]).transform(String),
    colorName: z.string(),
    color1: z.string().optional().default(''),
    color2: z.string().optional().default(''),
    colorFrontImage: z.string().optional().default(''),
    colorBackImage: z.string().optional().default(''),
    colorSideImage: z.string().optional().default(''),
    colorDirectSideImage: z.string().optional().default(''),
    colorOnModelFrontImage: z.string().optional().default(''),
    colorOnModelBackImage: z.string().optional().default(''),
    colorOnModelSideImage: z.string().optional().default(''),
    colorSwatchImage: z.string().optional().default(''),
  })
  .passthrough()

type SSProduct = z.infer<typeof ssProductSchema>

function resolveImageUrl(path: string): string | null {
  if (!path) return null
  if (path.startsWith('http')) return path
  return `${SS_IMAGE_BASE}${path.startsWith('/') ? '' : '/'}${path}`
}

/** Normalize S&S hex to #RRGGBB. Returns null for invalid/non-color values like "DROPPED". */
function normalizeHex(raw: string): string | null {
  const hex = raw.trim()
  if (!hex) return null
  const withHash = hex.startsWith('#') ? hex : `#${hex}`
  return /^#[0-9a-fA-F]{6}$/.test(withHash) ? withHash : null
}

const imageFields: Array<{ field: keyof SSProduct; type: string }> = [
  { field: 'colorFrontImage', type: 'front' },
  { field: 'colorBackImage', type: 'back' },
  { field: 'colorSideImage', type: 'side' },
  { field: 'colorDirectSideImage', type: 'direct-side' },
  { field: 'colorOnModelFrontImage', type: 'on-model-front' },
  { field: 'colorOnModelBackImage', type: 'on-model-back' },
  { field: 'colorOnModelSideImage', type: 'on-model-side' },
  { field: 'colorSwatchImage', type: 'swatch' },
]

function buildImages(product: SSProduct): Array<{ type: string; url: string }> {
  return imageFields.flatMap(({ field, type }) => {
    const raw = product[field] as string
    const url = resolveImageUrl(raw)
    return url ? [{ type, url }] : []
  })
}

void (async () => {
  const username = process.env.SS_USERNAME ?? process.env.SS_ACCOUNT_NUMBER
  const password = process.env.SS_PASSWORD ?? process.env.SS_API_KEY
  if (!username || !password) {
    console.error('Missing SS_USERNAME/SS_ACCOUNT_NUMBER or SS_PASSWORD/SS_API_KEY env vars')
    process.exit(1)
  }

  console.log('Fetching all products from S&S Activewear (this may take a moment)...')
  const credentials = Buffer.from(`${username}:${password}`).toString('base64')
  const resp = await fetch('https://api.ssactivewear.com/v2/products/', {
    headers: { Authorization: `Basic ${credentials}` },
  })
  if (!resp.ok) {
    console.error(`S&S API error: ${resp.status} ${resp.statusText}`)
    process.exit(1)
  }

  let raw: unknown
  try {
    raw = await resp.json()
  } catch (err) {
    console.error('S&S API returned non-JSON body:', err)
    process.exit(1)
  }

  const parsed = z.array(ssProductSchema).safeParse(raw)
  if (!parsed.success) {
    console.error('S&S product schema mismatch. Issues:', parsed.error.issues.slice(0, 5))
    process.exit(1)
  }
  const products = parsed.data
  console.log(`Got ${products.length} product rows from S&S`)

  // Group by styleID → dedup by colorName (keep first row per color for images/hex)
  const styleMap = new Map<string, Map<string, SSProduct>>()
  for (const p of products) {
    let colorMap = styleMap.get(p.styleID)
    if (!colorMap) {
      colorMap = new Map()
      styleMap.set(p.styleID, colorMap)
    }
    if (!colorMap.has(p.colorName)) {
      colorMap.set(p.colorName, p)
    }
  }
  console.log(`Grouped into ${styleMap.size} unique styles`)

  const { db } = await import('../src/shared/lib/supabase/db.js')
  const { catalogStyles, catalogColors, catalogImages } =
    await import('../src/db/schema/catalog-normalized.js')

  // Load all catalog_styles rows to map externalId → UUID
  const styleRows = await db
    .select({ id: catalogStyles.id, externalId: catalogStyles.externalId })
    .from(catalogStyles)
  const styleIdByExternalId = new Map(styleRows.map((r) => [r.externalId, r.id]))
  console.log(`Loaded ${styleIdByExternalId.size} catalog_styles rows`)

  let colorCount = 0
  let imageCount = 0
  let skipped = 0
  let failedStyles = 0
  const BATCH_SIZE = 50

  const externalIds = Array.from(styleMap.keys())
  for (let i = 0; i < externalIds.length; i += BATCH_SIZE) {
    const batch = externalIds.slice(i, i + BATCH_SIZE)

    for (const externalId of batch) {
      const styleUuid = styleIdByExternalId.get(externalId)
      if (!styleUuid) {
        skipped++
        continue
      }

      try {
        const colorMap = styleMap.get(externalId)!
        if (colorMap.size === 0) continue

        const colorValues = Array.from(colorMap.values()).map((p) => ({
          styleId: styleUuid,
          name: p.colorName,
          hex1: normalizeHex(p.color1),
          hex2: normalizeHex(p.color2),
          updatedAt: new Date(),
        }))

        const colorRows = await db
          .insert(catalogColors)
          .values(colorValues)
          .onConflictDoUpdate({
            target: [catalogColors.styleId, catalogColors.name],
            set: {
              hex1: sql`excluded.hex1`,
              hex2: sql`excluded.hex2`,
              updatedAt: new Date(),
            },
          })
          .returning({ id: catalogColors.id, name: catalogColors.name })

        colorCount += colorRows.length
        const colorIdByName = new Map(colorRows.map((r) => [r.name, r.id]))

        const imageValues = Array.from(colorMap.values()).flatMap((p) => {
          const colorId = colorIdByName.get(p.colorName)
          if (!colorId) return []
          return buildImages(p).map((img) => ({
            colorId,
            imageType: img.type as
              | 'front'
              | 'back'
              | 'side'
              | 'direct-side'
              | 'on-model-front'
              | 'on-model-back'
              | 'on-model-side'
              | 'swatch',
            url: img.url,
            updatedAt: new Date(),
          }))
        })

        if (imageValues.length > 0) {
          await db
            .insert(catalogImages)
            .values(imageValues)
            .onConflictDoUpdate({
              target: [catalogImages.colorId, catalogImages.imageType],
              set: { url: sql`excluded.url`, updatedAt: new Date() },
            })
          imageCount += imageValues.length
        }
      } catch (err) {
        failedStyles++
        console.error(`Failed to sync externalId=${externalId}:`, err)
      }
    }

    console.log(
      `Progress: ${Math.min(i + BATCH_SIZE, externalIds.length)}/${externalIds.length} styles, ` +
        `${colorCount} colors, ${imageCount} images`
    )
  }

  console.log(
    `Image sync complete — ${colorCount} colors, ${imageCount} images, ${skipped} styles skipped (not in catalog_styles), ${failedStyles} styles failed`
  )
  if (failedStyles > 0) process.exit(1)
})().catch((err) => {
  console.error('Image sync failed:', err)
  process.exit(1)
})
