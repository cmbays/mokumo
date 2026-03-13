import { defineConfig } from 'vitest/config'
import path from 'path'
import { fileURLToPath } from 'node:url'
import { storybookTest } from '@storybook/addon-vitest/vitest-plugin'
import { playwright } from '@vitest/browser-playwright'

// @ts-expect-error -- quickpickle types may lag behind vitest 4; remove when quickpickle ships vitest 4 types
import { quickpickle } from 'quickpickle'

const dirname =
  typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url))
const enableStorybookProject = process.env.STORYBOOK_TEST === '1'

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
    projects: [
      // Unit tests — existing configuration
      {
        extends: true,
        test: {
          name: 'unit',
          include: [
            'src/**/*.test.ts',
            'src/**/*.test.tsx',
            'lib/**/*.test.ts',
            'tools/**/*.test.ts',
          ],
          exclude: ['node_modules/**', '**/node_modules/**', 'tests/**'],
        },
      },
      // Acceptance tests — QuickPickle Gherkin scenarios
      {
        extends: true,
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
      // Storybook visual tests (opt-in via STORYBOOK_TEST=1)
      ...(enableStorybookProject
        ? [
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
          ]
        : []),
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
