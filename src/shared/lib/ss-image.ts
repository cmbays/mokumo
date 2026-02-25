const SS_CDN_BASE = 'https://www.ssactivewear.com'

/** Returns the S&S front-model CDN image URL for a given numeric styleId (catalog_archived.id). */
export function ssGarmentFrontImageUrl(styleId: string): string {
  return `${SS_CDN_BASE}/images/style/${styleId}/${styleId}_fm.jpg`
}
