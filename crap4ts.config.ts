import { defineConfig } from 'crap4ts'

export default defineConfig({
  threshold: 12,
  coverageMetric: 'line',
  exclude: ['**/*.test.*', '**/*.spec.*', '**/*.d.ts', '**/*.feature'],
})
