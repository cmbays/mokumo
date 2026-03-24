import type { StorybookConfig } from "@storybook/sveltekit";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.svelte"],
  addons: ["@storybook/addon-svelte-csf"],
  framework: "@storybook/sveltekit",
};

export default config;
