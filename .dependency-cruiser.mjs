/** @type {import('dependency-cruiser').IConfiguration} */
export default {
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
    // Domain layer must not import from features, infrastructure, shared, app, or db
    {
      name: 'domain-layer-isolation',
      comment: 'Domain layer must not import from features, infrastructure, shared, app, or db',
      severity: 'error',
      from: { path: '^src/domain', pathNot: '(__tests__|tests|\\.test\\.|\\.spec\\.|\\.steps\\.)' },
      to: { path: '^src/(features|infrastructure|shared|app|db)' },
    },
    // Shared layer must not import from features, infrastructure, or app
    {
      name: 'shared-layer-isolation',
      comment: 'Shared layer must not import from features, infrastructure, or app',
      severity: 'error',
      from: { path: '^src/shared', pathNot: '(__tests__|tests|\\.test\\.|\\.spec\\.|\\.steps\\.)' },
      to: { path: '^src/(features|infrastructure|app)' },
    },
    // Features layer must not import from infrastructure or app
    {
      name: 'features-layer-isolation',
      comment: 'Features layer must not import from infrastructure or app',
      severity: 'error',
      from: {
        path: '^src/features',
        pathNot: '(__tests__|tests|\\.test\\.|\\.spec\\.|\\.steps\\.)',
      },
      to: { path: '^src/(infrastructure|app)' },
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
