import { defineConfig } from 'vitest/config'
import path from 'path'
import { fileURLToPath } from 'node:url'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'
const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url))
const enableStorybookProject = process.env.STORYBOOK_TEST === '1'
const storybookProjects = enableStorybookProject
  ? [
      {
        extends: true as const,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, '.storybook'),
          }),
        ],
        test: {
          name: 'storybook',
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({}),
            instances: [
              {
                browser: 'chromium' as const,
              },
            ],
          },
          setupFiles: ['.storybook/vitest.setup.ts'],
        },
      },
    ]
  : undefined

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  test: {
    globals: true,
    exclude: ['node_modules/**', '**/node_modules/**', 'tests/**'],
    // keep Playwright E2E out of Vitest
    // Per-file environment overrides are handled via // @vitest-environment docblock comments in test files
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      thresholds: {
        // Financial critical — no exceptions
        'src/domain/lib/money.ts': {
          lines: 100,
          functions: 100,
        },
        'src/domain/services/pricing.service.ts': {
          lines: 100,
          functions: 100,
        },
        // Business logic
        'src/domain/rules/**': {
          lines: 90,
          functions: 90,
        },
        // DAL + infrastructure
        'src/infrastructure/repositories/**': {
          lines: 80,
          functions: 80,
        },
        // Overall floor
        lines: 70,
        functions: 70,
      },
      exclude: [
        'src/domain/entities/**',
        'src/**/*.test.ts',
        'src/**/__tests__/**',
        '**/*.config.*',
        'src/**/*.d.ts',
      ],
    },
    ...(storybookProjects ? { projects: storybookProjects } : {}),
  },
  resolve: {
    alias: {
      '@': path.resolve(dirname, 'src'),
      '@db': path.resolve(dirname, 'src/db'),
      '@domain': path.resolve(dirname, 'src/domain'),
      '@features': path.resolve(dirname, 'src/features'),
      '@shared': path.resolve(dirname, 'src/shared'),
      '@infra': path.resolve(dirname, 'src/infrastructure'),
      '@config': path.resolve(dirname, 'src/config'),
    },
  },
})
