import { colorModeGlobal, withColorMode } from '../src/decorators/with-color-mode'
import { reducedMotionGlobal, withReducedMotion } from '../src/decorators/with-reduced-motion'
import { surfaceGlobal, withSurface } from '../src/decorators/with-surface'
import { themeGlobal, withTheme } from '../src/decorators/with-theme'
import { storybookTheme } from './theme'

import '../src/styles/globals.css'

import type { Preview } from '@storybook/react'

const preview: Preview = {
  /**
   * Outermost first. Surface paints the backdrop, the mode attribute wraps it, the theme scope writes
   * the variables inside that, and reduced motion overrides one of them for the story itself — so each
   * layer only ever overrides the one above it.
   */
  decorators: [withReducedMotion, withTheme, withColorMode, withSurface],

  globalTypes: {
    ...themeGlobal,
    ...colorModeGlobal,
    ...reducedMotionGlobal,
    ...surfaceGlobal,
  },

  parameters: {
    layout: 'centered',

    // § Constraints: the a11y addon fails rather than reports, so an interaction-test run catches a
    // violation instead of leaving it in a panel nobody opened.
    a11y: { test: 'error' },

    controls: {
      expanded: true,
      matchers: { color: /(background|colour|color)$/i, date: /Date$/i },
    },

    docs: { theme: storybookTheme },

    options: {
      storySort: {
        order: ['Docs', ['Introduction', 'Tokens'], 'Chrome', 'Controls', 'Blocks'],
      },
    },
  },

  tags: ['autodocs'],
}

export default preview
