import 'server-only'
import { z } from 'zod'

// ---------------------------------------------------------------------------
// Environment variable validation — fail-fast at server startup.
//
// Called from instrumentation.ts (Next.js startup hook) so any missing var
// surfaces immediately as a clear error rather than a cryptic crash later.
//
// Validation is conditional on DATA_PROVIDER and SUPPLIER_ADAPTER so that
// mock/local environments don't need production credentials.
// ---------------------------------------------------------------------------

const baseSchema = z.object({
  DEMO_ACCESS_CODE: z.string().min(1),
  DATA_PROVIDER: z.enum(['mock', 'supabase']),
  SUPPLIER_ADAPTER: z.enum(['mock', 'supabase-catalog', 'ss-activewear']),
  ADMIN_SECRET: z.string().min(1),
})

// Required when DATA_PROVIDER=supabase
const supabaseSchema = z.object({
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
})

// Required when SUPPLIER_ADAPTER=ss-activewear
const ssSchema = z.object({
  SS_ACCOUNT_NUMBER: z.string().min(1),
  SS_API_KEY: z.string().min(1),
})

function formatIssues(issues: z.ZodIssue[]): string {
  return issues.map((i) => `  • ${i.path.join('.')}: ${i.message}`).join('\n')
}

export function validateEnv(): void {
  const baseResult = baseSchema.safeParse(process.env)
  if (!baseResult.success) {
    throw new Error(
      `Missing or invalid environment variables:\n${formatIssues(baseResult.error.issues)}\n\nSee .env.local.example for required values.`
    )
  }

  const { DATA_PROVIDER, SUPPLIER_ADAPTER } = baseResult.data

  if (DATA_PROVIDER === 'supabase') {
    const result = supabaseSchema.safeParse(process.env)
    if (!result.success) {
      throw new Error(
        `Supabase env vars missing (required when DATA_PROVIDER=supabase):\n${formatIssues(result.error.issues)}`
      )
    }
  }

  if (SUPPLIER_ADAPTER === 'ss-activewear') {
    const result = ssSchema.safeParse(process.env)
    if (!result.success) {
      throw new Error(
        `S&S credentials missing (required when SUPPLIER_ADAPTER=ss-activewear):\n${formatIssues(result.error.issues)}`
      )
    }
  }
}
