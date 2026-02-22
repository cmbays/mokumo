import { z } from 'zod'
import { garmentCategoryEnum } from './garment'

export const catalogImageSchema = z.object({
  imageType: z.enum([
    'front',
    'back',
    'side',
    'direct-side',
    'on-model-front',
    'on-model-back',
    'on-model-side',
    'swatch',
  ]),
  url: z.string().url(),
})

export type CatalogImage = z.infer<typeof catalogImageSchema>

export const catalogColorSchema = z.object({
  id: z.string().uuid(),
  styleId: z.string().uuid(),
  name: z.string().min(1),
  hex1: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullable(),
  hex2: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/)
    .nullable(),
  images: z.array(catalogImageSchema),
})

export type CatalogColor = z.infer<typeof catalogColorSchema>

export const catalogSizeSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  sortOrder: z.number().int().nonnegative(),
  priceAdjustment: z.number(),
})

export type CatalogSize = z.infer<typeof catalogSizeSchema>

/** Rich catalog style — styles joined with colors, images, and sizes. */
export const normalizedGarmentCatalogSchema = z.object({
  id: z.string().uuid(),
  source: z.string().min(1),
  externalId: z.string().min(1),
  brand: z.string().min(1),
  styleNumber: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable(),
  category: garmentCategoryEnum,
  subcategory: z.string().nullable(),
  piecePrice: z.number().nonnegative().nullable(),
  colors: z.array(catalogColorSchema),
  sizes: z.array(catalogSizeSchema),
  /** Resolved from catalog_style_preferences — defaults: enabled=true, favorite=false */
  isEnabled: z.boolean(),
  isFavorite: z.boolean(),
})

export type NormalizedGarmentCatalog = z.infer<typeof normalizedGarmentCatalogSchema>
