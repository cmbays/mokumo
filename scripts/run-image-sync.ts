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
import { collectColorGroupPairs } from './color-group-utils'
import {
  ssProductSchema,
  type SSProduct,
  buildImages,
  mapSSProductToColorValue,
} from './image-sync-utils'

if (existsSync('.env.local')) dotenv.config({ path: '.env.local', override: false })

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
  const { catalogStyles, catalogColors, catalogImages, catalogColorGroups } =
    await import('../src/db/schema/catalog-normalized.js')

  // Load all catalog_styles rows to map externalId → UUID and UUID → brandId
  const styleRows = await db
    .select({
      id: catalogStyles.id,
      externalId: catalogStyles.externalId,
      brandId: catalogStyles.brandId,
    })
    .from(catalogStyles)
  const styleIdByExternalId = new Map(styleRows.map((r) => [r.externalId, r.id]))
  const brandIdByStyleId = new Map(styleRows.map((r) => [r.id, r.brandId]))
  console.log(`Loaded ${styleIdByExternalId.size} catalog_styles rows`)

  let colorCount = 0
  let imageCount = 0
  let skipped = 0
  let failedStyles = 0
  const BATCH_SIZE = 50
  const CG_BATCH_SIZE = 1000

  // Collect distinct (brandId, colorGroupName) pairs for catalog_color_groups upsert
  const colorGroupSet = new Set<string>() // dedup key: `${brandId}::${colorGroupName}`
  const colorGroupPairs: Array<{ brandId: string; colorGroupName: string }> = []

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
        const colorMap = styleMap.get(externalId)
        if (!colorMap || colorMap.size === 0) continue

        const colorValues = Array.from(colorMap.values()).map((p) =>
          mapSSProductToColorValue(p, styleUuid)
        )

        // Wrap color + image inserts in a transaction so they succeed or fail
        // together — a style cannot end up with colors but no images on error.
        // Counts are returned from the callback so they only increment on commit.
        const { newColorCount, newImageCount } = await db.transaction(async (tx) => {
          const colorRows = await tx
            .insert(catalogColors)
            .values(colorValues)
            .onConflictDoUpdate({
              target: [catalogColors.styleId, catalogColors.name],
              set: {
                hex1: sql`excluded.hex1`,
                hex2: sql`excluded.hex2`,
                colorFamilyName: sql`excluded.color_family_name`,
                colorGroupName: sql`excluded.color_group_name`,
                colorCode: sql`excluded.color_code`,
                updatedAt: new Date(),
              },
            })
            .returning({ id: catalogColors.id, name: catalogColors.name })

          const colorIdByName = new Map(colorRows.map((r) => [r.name, r.id]))

          const imageValues = Array.from(colorMap.values()).flatMap((p) => {
            const colorId = colorIdByName.get(p.colorName)
            if (!colorId) return []
            return buildImages(p).map((img) => ({
              colorId,
              imageType: img.type,
              url: img.url,
              updatedAt: new Date(),
            }))
          })

          if (imageValues.length > 0) {
            await tx
              .insert(catalogImages)
              .values(imageValues)
              .onConflictDoUpdate({
                target: [catalogImages.colorId, catalogImages.imageType],
                set: { url: sql`excluded.url`, updatedAt: new Date() },
              })
          }

          return { newColorCount: colorRows.length, newImageCount: imageValues.length }
        })

        colorCount += newColorCount
        imageCount += newImageCount

        // Collect color group pairs after the transaction commits — pure in-memory
        // derivation from colorValues; does not need to be inside the transaction.
        const newPairs = collectColorGroupPairs(colorValues, brandIdByStyleId)
        for (const pair of newPairs) {
          const key = `${pair.brandId}::${pair.colorGroupName}`
          if (!colorGroupSet.has(key)) {
            colorGroupSet.add(key)
            colorGroupPairs.push(pair)
          }
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

  // Upsert all collected color groups (single batch, ON CONFLICT DO NOTHING)
  let colorGroupCount = 0
  if (colorGroupPairs.length > 0) {
    for (let j = 0; j < colorGroupPairs.length; j += CG_BATCH_SIZE) {
      const chunk = colorGroupPairs.slice(j, j + CG_BATCH_SIZE)
      await db.insert(catalogColorGroups).values(chunk).onConflictDoNothing()
      colorGroupCount += chunk.length
    }
    console.log(`Upserted ${colorGroupCount} color group entries into catalog_color_groups`)
  }

  console.log(
    `Image sync complete — ${colorCount} colors, ${imageCount} images, ${colorGroupCount} color groups, ${skipped} styles skipped (not in catalog_styles), ${failedStyles} styles failed`
  )
  if (failedStyles > 0) process.exit(1)
})().catch((err) => {
  console.error('Image sync failed:', err)
  process.exit(1)
})
