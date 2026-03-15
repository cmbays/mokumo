import React from 'react'
import type { Preview } from '@storybook/nextjs-vite'

import '../src/app/globals.css'

const preview: Preview = {
  globalTypes: {
    theme: {
      description: 'Color scheme',
      defaultValue: 'dark',
      toolbar: {
        title: 'Theme',
        icon: 'circlehollow',
        items: [
          { value: 'dark', title: 'Dark', icon: 'moon' },
          { value: 'light', title: 'Light', icon: 'sun' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals['theme'] ?? 'dark'
      if (typeof document !== 'undefined') {
        // Mokumo: :root = dark (default), .light class = light mode
        document.documentElement.classList.toggle('light', theme === 'light')
      }
      return React.createElement(Story)
    },
  ],
  parameters: {
    layout: 'padded',
    controls: {
      expanded: true,
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    nextjs: {
      appDirectory: true,
    },
    options: {
      storySort: {
        order: ['Overview', 'Foundations', 'Patterns', 'Shared', 'Features'],
      },
    },
    a11y: {
      test: 'todo',
    },
  },
}

export default preview
