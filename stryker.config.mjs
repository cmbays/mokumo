// @ts-check
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  mutate: ['src/domain/lib/money.ts', 'src/domain/services/pricing.service.ts'],
  testRunner: 'vitest',
  reporters: ['clear-text', 'html', 'progress'],
  incremental: true,
  incrementalFile: 'reports/stryker-incremental.json',
  htmlReporter: {
    fileName: 'reports/mutation/index.html',
  },
  thresholds: {
    high: 95,
    low: 90,
    break: 90,
  },
  concurrency: 3,
  timeoutMS: 60000,
  // Exclude directories with non-regular files (sockets, pipes) that Stryker can't copy
  ignorePatterns: ['.claude/**', '.git/**', 'node_modules/**', 'reports/**', '.stryker-tmp/**'],
}
