import 'server-only'

import { z } from 'zod'
import { eq, and, inArray } from 'drizzle-orm'
import { db } from '@shared/lib/supabase/db'
import { fctSupplierPricing, dimProduct, dimPriceGroup } from '@db/schema/marts'
import { getRedis } from '@shared/lib/redis'
import { logger } from '@shared/lib/logger'
import type { StructuredSupplierPricing } from '@domain/entities/supplier-pricing'

const log = logger.child({ domain: 'supabase-supplier-pricing' })

const CACHE_TTL_SECONDS = 900 // 15 minutes
const CACHE_PREFIX = 'supplier-pricing'

/** Validator for supplier style IDs and source codes */
const styleIdSchema = z.string().min(1).max(100)
const sourceSchema = z.string().min(1).max(50)

const VALID_TIER_NAMES = new Set(['piece', 'dozen', 'case'])

/** Raw row shape from the fact + dim join */
type PricingRow = {
  styleId: string
  source: string
  productName: string | null
  brandName: string | null
  colorPriceGroup: string
  sizePriceGroup: string
  tierName: string
  minQty: number
  maxQty: number | null
  unitPrice: number
}

/**
 * Parse flat pricing rows into structured supplier pricing.
 * Exported for testing without a database connection.
 */
export function parseSupplierPricingRows(
  rows: PricingRow[],
  styleId: string,
  source: string
): StructuredSupplierPricing | null {
  if (rows.length === 0) return null

  const first = rows[0]
  const groupMap = new Map<
    string,
    {
      group: { colorPriceGroup: string; sizePriceGroup: string }
      tiers: {
        tierName: 'piece' | 'dozen' | 'case'
        minQty: number
        maxQty: number | null
        unitPrice: number
      }[]
    }
  >()

  for (const row of rows) {
    if (!VALID_TIER_NAMES.has(row.tierName)) {
      log.warn('Unknown tierName in supplier pricing data — skipping row', {
        tierName: row.tierName,
        styleId,
        source,
      })
      continue
    }
    const key = `${row.colorPriceGroup}::${row.sizePriceGroup}`
    let entry = groupMap.get(key)
    if (!entry) {
      entry = {
        group: {
          colorPriceGroup: row.colorPriceGroup,
          sizePriceGroup: row.sizePriceGroup,
        },
        tiers: [],
      }
      groupMap.set(key, entry)
    }
    entry.tiers.push({
      tierName: row.tierName as 'piece' | 'dozen' | 'case',
      minQty: row.minQty,
      maxQty: row.maxQty,
      unitPrice: row.unitPrice,
    })
  }

  return {
    styleId,
    source,
    productName: first.productName,
    brandName: first.brandName,
    priceGroups: Array.from(groupMap.values()),
  }
}

/**
 * Fetch pricing for a single style from the marts fact table.
 * Results are cached in Redis with a 15-minute TTL.
 */
export async function getStylePricing(
  styleId: string,
  source: string
): Promise<StructuredSupplierPricing | null> {
  if (!styleIdSchema.safeParse(styleId).success) {
    log.warn('getStylePricing called with invalid styleId', { styleId, source })
    return null
  }
  if (!sourceSchema.safeParse(source).success) {
    log.warn('getStylePricing called with invalid source', { styleId, source })
    return null
  }

  // Check Redis cache
  const redis = getRedis()
  const cacheKey = `${CACHE_PREFIX}:${source}:${styleId}`
  if (redis) {
    try {
      const cached = await redis.get<StructuredSupplierPricing>(cacheKey)
      if (cached) return cached
    } catch (error) {
      log.warn('Redis cache read failed — proceeding without cache', { cacheKey, error })
    }
  }

  try {
    const rows = await db
      .select({
        styleId: dimProduct.styleId,
        source: dimProduct.source,
        productName: dimProduct.productName,
        brandName: dimProduct.brandName,
        colorPriceGroup: dimPriceGroup.colorPriceGroup,
        sizePriceGroup: dimPriceGroup.sizePriceGroup,
        tierName: fctSupplierPricing.tierName,
        minQty: fctSupplierPricing.minQty,
        maxQty: fctSupplierPricing.maxQty,
        unitPrice: fctSupplierPricing.unitPrice,
      })
      .from(fctSupplierPricing)
      .innerJoin(dimProduct, eq(fctSupplierPricing.productKey, dimProduct.productKey))
      .innerJoin(dimPriceGroup, eq(fctSupplierPricing.priceGroupKey, dimPriceGroup.priceGroupKey))
      .where(
        and(
          eq(dimProduct.styleId, styleId),
          eq(dimProduct.source, source),
          eq(fctSupplierPricing.isCurrent, true)
        )
      )

    const result = parseSupplierPricingRows(rows, styleId, source)

    // Cache the result
    if (redis && result) {
      try {
        await redis.set(cacheKey, result, { ex: CACHE_TTL_SECONDS })
      } catch (error) {
        log.warn('Redis cache write failed', { cacheKey, error })
      }
    }

    return result
  } catch (error) {
    log.error('Failed to fetch style pricing from marts', { styleId, source, error })
    throw error
  }
}

/**
 * Fetch pricing for multiple styles in a single query.
 * Individual results are cached in Redis.
 */
export async function getStylesPricing(
  styleIds: string[],
  source: string
): Promise<Map<string, StructuredSupplierPricing>> {
  const result = new Map<string, StructuredSupplierPricing>()
  if (styleIds.length === 0) return result

  // Validate all IDs
  const validIds = styleIds.filter((id) => styleIdSchema.safeParse(id).success)
  if (validIds.length < styleIds.length) {
    const invalidCount = styleIds.length - validIds.length
    log.warn('getStylesPricing filtered out invalid styleIds', {
      invalidCount,
      totalCount: styleIds.length,
      source,
    })
  }
  if (validIds.length === 0) return result

  // Check Redis cache for each ID
  const redis = getRedis()
  const uncachedIds: string[] = []

  if (redis) {
    try {
      const pipeline = redis.pipeline()
      for (const id of validIds) {
        pipeline.get<StructuredSupplierPricing>(`${CACHE_PREFIX}:${source}:${id}`)
      }
      const cached = await pipeline.exec<(StructuredSupplierPricing | null)[]>()
      for (let i = 0; i < validIds.length; i++) {
        if (cached[i]) {
          result.set(validIds[i], cached[i]!)
        } else {
          uncachedIds.push(validIds[i])
        }
      }
    } catch (error) {
      log.warn('Redis pipeline read failed — querying all from DB', { source, error })
      uncachedIds.push(...validIds)
    }
  } else {
    uncachedIds.push(...validIds)
  }

  if (uncachedIds.length === 0) return result

  try {
    const rows = await db
      .select({
        styleId: dimProduct.styleId,
        source: dimProduct.source,
        productName: dimProduct.productName,
        brandName: dimProduct.brandName,
        colorPriceGroup: dimPriceGroup.colorPriceGroup,
        sizePriceGroup: dimPriceGroup.sizePriceGroup,
        tierName: fctSupplierPricing.tierName,
        minQty: fctSupplierPricing.minQty,
        maxQty: fctSupplierPricing.maxQty,
        unitPrice: fctSupplierPricing.unitPrice,
      })
      .from(fctSupplierPricing)
      .innerJoin(dimProduct, eq(fctSupplierPricing.productKey, dimProduct.productKey))
      .innerJoin(dimPriceGroup, eq(fctSupplierPricing.priceGroupKey, dimPriceGroup.priceGroupKey))
      .where(
        and(
          inArray(dimProduct.styleId, uncachedIds),
          eq(dimProduct.source, source),
          eq(fctSupplierPricing.isCurrent, true)
        )
      )

    // Group rows by styleId
    const rowsByStyle = new Map<string, PricingRow[]>()
    for (const row of rows) {
      const existing = rowsByStyle.get(row.styleId) ?? []
      existing.push(row)
      rowsByStyle.set(row.styleId, existing)
    }

    // Parse each group and cache
    for (const [id, styleRows] of rowsByStyle) {
      const parsed = parseSupplierPricingRows(styleRows, id, source)
      if (parsed) {
        result.set(id, parsed)
        if (redis) {
          try {
            await redis.set(`${CACHE_PREFIX}:${source}:${id}`, parsed, { ex: CACHE_TTL_SECONDS })
          } catch (error) {
            log.warn('Redis cache write failed', {
              cacheKey: `${CACHE_PREFIX}:${source}:${id}`,
              error,
            })
          }
        }
      }
    }

    return result
  } catch (error) {
    log.error('Failed to fetch styles pricing from marts', {
      styleIds: uncachedIds,
      source,
      error,
    })
    throw error
  }
}
