/**
 * Test file fixture utilities for E2E tests.
 *
 * Creates minimal valid binary test files without requiring disk I/O.
 * All buffers are constructed from well-known byte sequences.
 */

// ---------------------------------------------------------------------------
// Minimal 1×1 red pixel PNG (68 bytes)
//
// Structure:
//   8-byte PNG signature
//   25-byte IHDR chunk  (width=1, height=1, bit-depth=8, color-type=2 RGB)
//   22-byte IDAT chunk  (zlib-compressed scanline: filter=0, R=255, G=0, B=0)
//   12-byte IEND chunk
//
// The zlib payload was computed offline:
//   uncompressed scanline = [0x00, 0xFF, 0x00, 0x00]  (filter=None, R, G, B)
//   compress with level 1 deflate → the 7-byte sequence used below
// ---------------------------------------------------------------------------

/** Returns a Buffer containing a valid 1×1 red-pixel PNG. */
export function createMinimalPng(): Buffer {
  const bytes = [
    // PNG signature
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a,
    // IHDR chunk (length=13)
    0x00,
    0x00,
    0x00,
    0x0d, // data length
    0x49,
    0x48,
    0x44,
    0x52, // "IHDR"
    0x00,
    0x00,
    0x00,
    0x01, // width = 1
    0x00,
    0x00,
    0x00,
    0x01, // height = 1
    0x08, // bit depth = 8
    0x02, // color type = 2 (RGB)
    0x00, // compression = deflate
    0x00, // filter = adaptive
    0x00, // interlace = none
    0x90,
    0x77,
    0x53,
    0xde, // CRC-32 for IHDR data
    // IDAT chunk (length=10) — zlib-compressed 1×1 red pixel scanline
    0x00,
    0x00,
    0x00,
    0x0a, // data length
    0x49,
    0x44,
    0x41,
    0x54, // "IDAT"
    0x08,
    0xd7, // zlib header (CM=8, CINFO=0, check bits)
    0x63,
    0xf8,
    0xcf,
    0xc0, // compressed data (filter=0, R=255, G=0, B=0)
    0x00,
    0x00,
    0x00,
    0x02, // adler32 checksum of scanline
    0x00,
    0x01, // adler32 (cont.)
    0xe2,
    0x21,
    0xbc,
    0x33, // CRC-32 for IDAT chunk
    // IEND chunk (length=0)
    0x00,
    0x00,
    0x00,
    0x00, // data length
    0x49,
    0x45,
    0x4e,
    0x44, // "IEND"
    0xae,
    0x42,
    0x60,
    0x82, // CRC-32 for IEND
  ]
  return Buffer.from(bytes)
}

/** Returns the MIME type for the minimal PNG fixture. */
export const MINIMAL_PNG_MIME = 'image/png'

/** Returns the filename for the minimal PNG fixture. */
export const MINIMAL_PNG_FILENAME = 'test-artwork.png'
