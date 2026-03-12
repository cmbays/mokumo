// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook'

import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'
import importPlugin from 'eslint-plugin-import'

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
      'import/no-restricted-paths': 'off',
    },
  }, // MockAdapter is the supplier-layer equivalent of _providers/mock — allowed to import from _providers
  {
    files: ['lib/suppliers/**', 'src/infrastructure/adapters/**'],
    rules: {
      'no-restricted-imports': 'off',
    },
  }, // Clean Architecture layer boundaries (import/no-restricted-paths)
  // Dependency rule: domain ← shared ← features ← app (outer layers may import inner, never reverse)
  // Scoped to non-test source files only (test files may cross layer boundaries for fixtures).
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    ignores: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**'],
    plugins: { import: importPlugin },
    rules: {
      'import/no-restricted-paths': [
        'error',
        {
          zones: [
            // shared/ is reusable infrastructure — must not depend on features/ or infra/
            {
              target: './src/shared',
              from: './src/features',
              message:
                'src/shared/ cannot import from src/features/ — shared must be reusable across all feature domains.',
            },
            {
              target: './src/shared',
              from: './src/infrastructure',
              message:
                'src/shared/ cannot import from src/infrastructure/ — shared must not depend on implementation details.',
            },
            // features/ must not reach into infrastructure/ — use repository imports via app/ wiring
            {
              target: './src/features',
              from: './src/infrastructure',
              message:
                'src/features/ cannot import from src/infrastructure/ — features must receive data via props or hooks, not call repositories directly.',
            },
            // domain/ is the innermost ring — pure business logic, no outer-layer dependencies
            {
              target: './src/domain',
              from: './src/features',
              message:
                'src/domain/ cannot import from src/features/ — domain is the innermost ring.',
            },
            {
              target: './src/domain',
              from: './src/infrastructure',
              message:
                'src/domain/ cannot import from src/infrastructure/ — domain is the innermost ring.',
            },
            {
              target: './src/domain',
              from: './src/shared',
              message: 'src/domain/ cannot import from src/shared/ — domain is the innermost ring.',
            },
          ],
        },
      ],
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
