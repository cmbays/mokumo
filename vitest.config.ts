import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    globals: true,
    exclude: ['node_modules/**', 'knowledge-base/**', 'tests/**'], // keep KB deps and Playwright E2E out of Vitest
    // Per-file environment overrides are handled via // @vitest-environment docblock comments in test files
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      thresholds: {
        // Financial critical — no exceptions
        'src/domain/lib/money.ts': { lines: 100, functions: 100 },
        'src/domain/services/pricing.service.ts': { lines: 100, functions: 100 },
        // Business logic
        'src/domain/rules/**': { lines: 90, functions: 90 },
        // DAL + infrastructure
        'src/infrastructure/repositories/**': { lines: 80, functions: 80 },
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
        'knowledge-base/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@db': path.resolve(__dirname, 'src/db'),
      '@domain': path.resolve(__dirname, 'src/domain'),
      '@features': path.resolve(__dirname, 'src/features'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@infra': path.resolve(__dirname, 'src/infrastructure'),
      '@config': path.resolve(__dirname, 'src/config'),
    },
  },
})
