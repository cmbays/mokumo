/**
 * Idempotent storage bootstrap — creates Supabase Storage buckets and applies RLS policies.
 *
 * Run once before any upload:
 *   npx tsx -r ./scripts/mock-server-only.cjs scripts/bootstrap-storage.ts
 */
import dotenv from 'dotenv'
import { existsSync } from 'fs'
import { createClient } from '@supabase/supabase-js'

if (existsSync('.env.local')) dotenv.config({ path: '.env.local', override: false })

const ARTWORK_ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/svg+xml',
  'image/tiff',
  'image/gif',
  'application/pdf',
]

// 50 MB in bytes
const ARTWORK_FILE_SIZE_LIMIT = 52_428_800

async function main(): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment'
    )
  }

  const admin = createClient(url, serviceRoleKey, { auth: { persistSession: false } })

  // ── 1. Create artwork bucket ────────────────────────────────────────────
  console.log('Creating artwork bucket...')
  const { data: existing } = await admin.storage.getBucket('artwork')

  if (existing) {
    console.log('  ✓ artwork bucket already exists — skipping creation')
  } else {
    const { error } = await admin.storage.createBucket('artwork', {
      public: false,
      fileSizeLimit: ARTWORK_FILE_SIZE_LIMIT,
      allowedMimeTypes: ARTWORK_ALLOWED_MIME_TYPES,
    })
    if (error) {
      // createBucket returns an error if the bucket already exists on some SDK versions
      if (error.message.toLowerCase().includes('already exists')) {
        console.log('  ✓ artwork bucket already exists — skipping creation')
      } else {
        throw new Error(`Failed to create artwork bucket: ${error.message}`)
      }
    } else {
      console.log('  ✓ artwork bucket created')
    }
  }

  // ── 2. Apply RLS policies via raw SQL ───────────────────────────────────
  console.log('Applying RLS policies...')

  const policies = [
    {
      name: 'shop_select_artwork',
      sql: `
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE schemaname = 'storage'
              AND tablename = 'objects'
              AND policyname = 'shop_select_artwork'
          ) THEN
            CREATE POLICY "shop_select_artwork" ON storage.objects
              FOR SELECT USING (
                bucket_id = 'artwork'
                AND (storage.foldername(name))[1] = auth.jwt()->>'shop_id'
              );
          END IF;
        END $$;
      `,
    },
    {
      name: 'shop_delete_artwork',
      sql: `
        DO $$ BEGIN
          IF NOT EXISTS (
            SELECT 1 FROM pg_policies
            WHERE schemaname = 'storage'
              AND tablename = 'objects'
              AND policyname = 'shop_delete_artwork'
          ) THEN
            CREATE POLICY "shop_delete_artwork" ON storage.objects
              FOR DELETE USING (
                bucket_id = 'artwork'
                AND (storage.foldername(name))[1] = auth.jwt()->>'shop_id'
              );
          END IF;
        END $$;
      `,
    },
  ]

  for (const policy of policies) {
    const { error } = await admin.rpc('exec_sql', { sql: policy.sql }).single()
    if (error) {
      // Fall back to a note — local Supabase may not expose exec_sql RPC.
      // In that case, apply policies via `supabase/migrations/` instead.
      console.warn(`  ⚠ Could not apply policy "${policy.name}" via RPC: ${error.message}`)
      console.warn(
        '    Apply this policy manually via Supabase Dashboard → SQL Editor, or add it to a migration file.'
      )
    } else {
      console.log(`  ✓ Policy "${policy.name}" applied (or already exists)`)
    }
  }

  console.log('\nStorage bootstrap complete.')
}

main().catch((err: unknown) => {
  console.error('Bootstrap failed:', err)
  process.exit(1)
})
