import { z } from 'zod'

/**
 * Lightweight color type used by color filter UI (ColorFilterGrid, FavoritesColorSection).
 * Carries colorFamilyName for the family-based filter tab system (Wave 3, #632).
 * colorFamilyName is required: null = supplier did not provide one (pre-sync or non-S&S source).
 * Computed at page SSR time via extractUniqueColors() in garment-transforms.ts.
 */
export const filterColorSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  swatchTextColor: z.string(),
  colorFamilyName: z.string().min(1).nullable(),
})

export type FilterColor = z.infer<typeof filterColorSchema>
