---
shaping: true
---

# Artwork Library — Frame

**Pipeline**: `20260301-artwork-vertical`
**Stage**: Shaping
**Date**: 2026-03-02

---

## Source

> Gary's current workflow: Photoshop-centric. Creates and touches up artwork himself. Uses AI tools (ChatGPT, exploring NanoBanana) for design creation. Receives files via email or Google Drive. Organizes customer folders on local LAN storage. Has a legacy Amazon design library. Re-uploads into Printlife from local storage for reorders — manual, friction-heavy every time. Does own ink mixing and screen separations (white underbase + spot colors). Volume: ~15–20 unique artworks per month, significant reorder volume on existing designs.

> Research finding: No shop management platform auto-detects colors from uploaded artwork. Every competitor requires manual color count entry. No competitor offers a per-customer artwork library that spans orders (even DecoNetwork's "design library" is order-scoped, not customer-scoped). Artwork management is table-stakes — it's at every competitor's lowest paid tier. We differentiate on intelligence and quality, not gating.

> Spike #726 (storage, complete): Sharp rendition overhead ×1.006–1.08 (near-zero). Supabase Free tier (1 GB) covers ~900 artworks without PSDs. Migrate to Cloudflare R2 when PSDs ship (~$0.37/mo). Presigned upload URL pattern required — Vercel's 4.5 MB body limit makes server-proxied uploads non-viable.

> Spike #725 (color detection, complete): `get-svg-colors` exact (3/3 colors in 5 ms for SVG). `quantize` (MMCQ) identifies correct colors but over-counts — needs CIEDE2000 post-merge + 2% coverage threshold. Pantone matching ΔE 1–3 for spot colors. Critical: `flatten(garmentColor)` required before raster detection (transparent → black without it). 3-path architecture confirmed: SVG → exact / raster → quantize+merge / PSD → ag-psd.

---

## Problem

Gary's artwork workflow has no system of record. Files arrive by email and Google Drive, live on a local LAN drive organized by gut instinct, and must be re-uploaded manually every time a customer reorders. There is no way to know — without digging through email — what artwork a customer has previously used, which version was approved, or whether the file on the LAN is print-ready. When the same school orders annually, Gary manually reconstructs the artwork provenance from memory and email search. When a customer's artwork is finally approved, that approval exists only as a replied email — not captured in the production system, not legally defensible. When Gary separates colors and burns screens, the relationship between the artwork and the screen room work is purely in his head.

This is not unique to Gary. Every competitor solves the basic problem (file attachment to orders) but none solves the deeper problem: artwork as a persistent, reusable, intelligent asset owned by the customer, not by a single order.

---

## Outcome

A customer's artwork lives in Screen Print Pro as a first-class object — organized per customer, versioned over time, validated for print readiness, connected to quotes for instant reuse. Gary can browse a customer's artwork history, select a design, have the color count auto-detected, and build a quote without re-uploading or guessing. When proof is ready, Gary sends it from the system and the customer approves it via a frictionless link — capturing a legally valid record. Approved artwork generates the separation metadata that the screen room uses to prep screens. No file leaves the system without a paper trail. No reorder requires re-uploading art that already exists.

The system does not replace Gary's Photoshop workflow — it becomes the before and after: receiving files in, and handing structured data out to the rest of the production pipeline.
