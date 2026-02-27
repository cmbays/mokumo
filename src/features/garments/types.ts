import { z } from 'zod'

/**
 * Lightweight color type used by garment transforms and detail components.
 * colorFamilyName/colorGroupName are required fields: null = supplier did not provide.
 * Computed at page SSR time via extractUniqueColors() in garment-transforms.ts.
 */
export const filterColorSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  swatchTextColor: z.string(),
  colorFamilyName: z.string().min(1).nullable(),
  colorGroupName: z.string().min(1).nullable(),
})

export type FilterColor = z.infer<typeof filterColorSchema>

/**
 * Deduplicated color group for the filter swatch grid (Wave 3, #632).
 * Each entry represents one canonical color group (e.g. "Navy", "Kelly Green").
 * colorGroupName is always present — null-group colors are excluded from the grid.
 * Computed via extractColorGroups() in garment-transforms.ts.
 */
export const filterColorGroupSchema = z.object({
  colorGroupName: z.string().min(1),
  colorFamilyName: z.string().min(1).nullable(),
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  swatchTextColor: z.string(),
})

export type FilterColorGroup = z.infer<typeof filterColorGroupSchema>
