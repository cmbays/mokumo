// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook'

import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import boundaries from 'eslint-plugin-boundaries'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Allow _-prefixed variables for intentional destructured-rest patterns
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      // Pages must use <Topbar breadcrumbs={buildBreadcrumbs(...)}> — not raw Breadcrumb
      // Mock-data modules must only be accessed through infrastructure/repositories/_providers/mock/
      // Interface declarations drift from Zod schemas — use type aliases or z.infer<>
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@shared/ui/primitives/breadcrumb',
              message:
                'Use <Topbar breadcrumbs={buildBreadcrumbs(...)}> instead of raw <Breadcrumb>. See src/shared/lib/breadcrumbs.ts',
            },
          ],
          patterns: [
            {
              regex: '@infra/repositories/_providers',
              message:
                'Import from @infra/repositories/{domain} only. Never import from _providers directly — that layer is infrastructure-internal.',
            },
          ],
        },
      ],
      // Mock data files are at src/infrastructure/repositories/_providers/mock/data*.ts.
      // App layer must import via @infra/repositories/{domain} — never from _providers directly.
      // The no-restricted-imports pattern below enforces this for all src/ consumers.
      // TODO(#404): promote to error once all 145 interface violations are migrated.
      // Use `type` for component props, `z.infer<typeof Schema>` for domain entities.
      '@typescript-eslint/consistent-type-definitions': ['warn', 'type'],
    },
  }, // Topbar is the only file allowed to import from @shared/ui/primitives/breadcrumb
  {
    files: ['src/shared/ui/layouts/topbar.tsx'],
    rules: {
      'no-restricted-imports': 'off',
    },
  }, // Infrastructure layer is allowed to import from _providers internally
  {
    files: ['src/infrastructure/**'],
    rules: {
      'no-restricted-imports': 'off',
    },
  }, // Test files are allowed to import mock _providers directly for test fixtures
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**'],
    rules: {
      'no-restricted-imports': 'off',
      'boundaries/element-types': 'off',
    },
  }, // MockAdapter is the supplier-layer equivalent of _providers/mock — allowed to import from _providers
  {
    files: ['lib/suppliers/**', 'src/infrastructure/adapters/**'],
    rules: {
      'no-restricted-imports': 'off',
    },
  }, // Clean Architecture layer boundaries (boundaries/element-types)
  // Dependency rule: domain ← shared ← features ← app (outer layers may import inner, never reverse)
  // Scoped to non-test source files only (test files may cross layer boundaries for fixtures).
  // Layer dependency rules are enforced in two places:
  //   1. .dependency-cruiser.mjs — allowed whitelist (graph-level, runs in CI via `test:architecture`)
  //   2. HERE — eslint-plugin-boundaries (element-types rules, runs on every lint)
  // Keep both in sync when modifying allowed dependency directions.
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ignores: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**'],
    plugins: { boundaries },
    settings: {
      'boundaries/elements': [
        { type: 'domain', pattern: ['src/domain/**'] },
        { type: 'shared', pattern: ['src/shared/**'] },
        { type: 'features', pattern: ['src/features/**'] },
        { type: 'infrastructure', pattern: ['src/infrastructure/**'] },
        { type: 'app', pattern: ['src/app/**'] },
        { type: 'db', pattern: ['src/db/**'] },
        { type: 'config', pattern: ['src/config/**'] },
      ],
    },
    rules: {
      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          rules: [
            { from: 'domain', allow: ['domain'] },
            { from: 'shared', allow: ['domain', 'shared'] },
            { from: 'features', allow: ['domain', 'shared', 'features'] },
            { from: 'infrastructure', allow: ['domain', 'shared', 'infrastructure', 'db'] },
            {
              from: 'app',
              allow: ['domain', 'shared', 'features', 'infrastructure', 'app', 'db', 'config'],
            },
            { from: 'db', allow: ['db'] },
            { from: 'config', allow: ['config'] },
          ],
        },
      ],
    },
  }, // Pre-existing boundary violations — baselined here (matches .dependency-cruiser-known-violations.json).
  // Fix these files to remove this override; do not add new entries.
  {
    files: [
      'src/domain/entities/garment.ts', // domain → db
      'src/features/pricing/components/RushTierEditor.tsx', // features → app
      'src/features/pricing/components/GarmentMarkupEditor.tsx', // features → app
      'src/features/artwork/components/ArtworkLibraryClient.tsx', // features → app, features → db
    ],
    rules: {
      'boundaries/element-types': 'off',
    },
  }, // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Skill templates are reference scaffolds, not production code
    '.claude/skills/**/templates/**',
    // Node.js utility scripts — CommonJS, not part of the Next.js app
    'scripts/**',
  ]),
  ...storybook.configs['flat/recommended'],
])

export default eslintConfig
