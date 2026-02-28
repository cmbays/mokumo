const HEX_COLOR_RE = /^#[0-9a-fA-F]{6}$/

/**
 * Convert a hex color string to RGB components (0-255).
 * Returns {0,0,0} for malformed input instead of producing NaN.
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  if (!HEX_COLOR_RE.test(hex)) {
    return { r: 0, g: 0, b: 0 }
  }
  return {
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16),
  }
}

