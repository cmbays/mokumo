import type { StorybookConfig } from '@storybook/nextjs-vite'

const config = {
  stories: [
    '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../src/shared/ui/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../src/features/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],

  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook/addon-vitest'],

  framework: {
    name: '@storybook/nextjs-vite',
    options: {},
  },

  staticDirs: ['../public'],

  viteFinal: async (config) => {
    // Suppress "unable to find package.json for radix-ui" Vite warning.
    // radix-ui is a meta-package — its sub-packages are what gets consumed.
    config.optimizeDeps ??= {}
    config.optimizeDeps.exclude ??= []
    if (!config.optimizeDeps.exclude.includes('radix-ui')) {
      config.optimizeDeps.exclude.push('radix-ui')
    }
    return config
  },
} satisfies StorybookConfig

export default config
