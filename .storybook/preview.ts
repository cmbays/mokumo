import type { Preview } from '@storybook/nextjs-vite'

import '../src/app/globals.css'

const preview: Preview = {
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
