import { defineConfig } from 'vitest/config'
import path from 'path'
import { fileURLToPath } from 'node:url'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'

import { quickpickle } from 'quickpickle'

const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  test: {
    globals: true,
    exclude: ['node_modules/**', '**/node_modules/**', 'tests/**'],
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
    // Three workspace projects:
    //   "unit"       — regular unit/integration tests. Selected by `npm test`.
    //   "acceptance" — QuickPickle Gherkin scenarios.
    //   "storybook"  — browser tests. Always defined so the Storybook Test UI
    //                  panel can connect. Run via `npm run test:storybook` or
    //                  from within the Storybook UI.
    projects: [
      {
        extends: true as const,
        test: { name: 'unit' },
      },
      // Acceptance tests — QuickPickle Gherkin scenarios
      {
        extends: true as const,
        plugins: [quickpickle()],
        test: {
          name: 'acceptance',
          include: ['src/**/*.feature'],
          setupFiles: [
            'src/domain/__tests__/support/world.ts',
            'src/domain/lib/__tests__/money.steps.ts',
            'src/domain/services/__tests__/pricing.steps.ts',
          ],
        },
      },
      {
        extends: true as const,
        plugins: [
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
    ],
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
