---
title: 'ADR-011: File Upload Service'
description: 'Decision on the file upload service for artwork, proofs, and mockups is open pending validation of large-file UX requirements.'
category: decision
status: active
adr_status: open
adr_number: 011
date: 2026-03-08
supersedes: null
superseded_by: null
depends_on: [008]
---

# ADR-011: File Upload Service

## Status

Open

## Context

Artwork uploads are a core feature (customer art library, proof delivery, mockups). We began building a custom upload handler and concluded that approach adds maintenance burden without differentiated value. Need a decision on which service to adopt. A key constraint: print-ready artwork files can exceed 100MB — chunked and resumable upload support may be required.

## Decision

No decision yet. Options under consideration:

1. **Supabase Storage** — same SDK as the database, RLS on buckets, CDN included, bundles with the existing Supabase account. Simplest path given existing integration.
2. **UploadThing** — purpose-built for Next.js/React, handles chunked uploads, resumable uploads, direct browser-to-storage, better DX for large file handling. Separate vendor and billing.

## Options Considered

See Decision section above. What we need to validate: direct upload UX for large files; whether Supabase Storage's upload UX is sufficient or if UploadThing's chunked/resumable approach is necessary for print-ready file sizes.

## Consequences

TBD — pending decision.
