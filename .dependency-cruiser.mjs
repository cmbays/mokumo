// Layer dependency rules are enforced in two places:
//   1. HERE — dependency-cruiser (allowed whitelist, runs in CI via `test:architecture`)
//   2. eslint.config.mjs — eslint-plugin-boundaries (element-types rules, runs on every lint)
// Keep both in sync when modifying allowed dependency directions.

/** @type {import('dependency-cruiser').IConfiguration} */
export default {
  allowed: [
    // --- Layer dependency whitelist (DDD layered architecture) ---
    // domain → domain only (innermost ring)
    {
      from: { path: '^src/domain', pathNot: '\\.(test|spec)\\.(ts|tsx)$|__tests__' },
      to: { path: '^src/domain' },
    },
    // shared → domain, shared
    {
      from: { path: '^src/shared', pathNot: '\\.(test|spec)\\.(ts|tsx)$|__tests__' },
      to: { path: '^src/(domain|shared)' },
    },
    // features → domain, shared, features
    {
      from: { path: '^src/features', pathNot: '\\.(test|spec)\\.(ts|tsx)$|__tests__' },
      to: { path: '^src/(domain|shared|features)' },
    },
    // infrastructure → domain, shared, infrastructure, db
    {
      from: { path: '^src/infrastructure', pathNot: '\\.(test|spec)\\.(ts|tsx)$|__tests__' },
      to: { path: '^src/(domain|shared|infrastructure|db)' },
    },
    // app → anything under src/ (outermost ring)
    {
      from: { path: '^src/app', pathNot: '\\.(test|spec)\\.(ts|tsx)$|__tests__' },
      to: { path: '^src/' },
    },
    // db → db only
    {
      from: { path: '^src/db', pathNot: '\\.(test|spec)\\.(ts|tsx)$|__tests__' },
      to: { path: '^src/db' },
    },
    // config → config only
    {
      from: { path: '^src/config', pathNot: '\\.(test|spec)\\.(ts|tsx)$|__tests__' },
      to: { path: '^src/config' },
    },
    // --- npm dependencies: any module may import from node_modules ---
    {
      from: {},
      to: { dependencyTypes: ['npm', 'npm-dev', 'npm-optional', 'npm-peer', 'npm-bundled'] },
    },
    // --- Node.js core modules (crypto, async_hooks, etc.) ---
    {
      from: {},
      to: { dependencyTypes: ['core'] },
    },
    // --- lib/ (supplier adapters, outside src/) — app & infrastructure may use ---
    {
      from: { path: '^src/(app|infrastructure)' },
      to: { path: '^lib/' },
    },
    // --- Test files may import from anywhere ---
    {
      from: { path: '\\.(test|spec)\\.(ts|tsx)$|__tests__' },
      to: {},
    },
    // --- Non-src files (config files, scripts, etc.) may import from anywhere ---
    {
      from: { pathNot: '^src/' },
      to: {},
    },
  ],
  allowedSeverity: 'error',
  forbidden: [
    {
      name: 'no-circular',
      comment: 'No circular dependencies anywhere',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'no-orphans',
      comment: 'No unused modules (files nothing imports)',
      severity: 'warn',
      from: {
        orphan: true,
        pathNot: [
          '\\.d\\.ts$',
          '\\.config\\.',
          '\\.test\\.',
          '\\.spec\\.',
          '\\.feature$',
          '\\.steps\\.',
          '__tests__/',
          'tests/',
          '\\.storybook/',
          'src/app/',
          'src/middleware\\.ts',
          'tailwind',
          'postcss',
          'drizzle\\.config',
        ],
      },
      to: {},
    },
  ],
  options: {
    doNotFollow: {
      dependencyTypes: ['npm', 'npm-dev', 'npm-optional', 'npm-peer', 'npm-bundled'],
    },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
    cache: {
      strategy: 'content',
    },
    reporterOptions: {
      dot: {
        collapsePattern: 'node_modules/(@[^/]+/[^/]+|[^/]+)',
      },
    },
  },
}
