import type { Meta, StoryObj } from '@storybook/react'

import { HeroTerminal } from './hero-terminal'
import { heroTerminalDefinition } from './hero-terminal.definition'

const meta = {
  title: 'Blocks/Hero/Terminal',
  component: HeroTerminal,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof HeroTerminal>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = { args: heroTerminalDefinition.defaults }

export const TitleBarOnly: Story = {
  args: { ...heroTerminalDefinition.defaults, chrome: 'title' },
}

export const LightsOnly: Story = {
  args: { ...heroTerminalDefinition.defaults, chrome: 'lights' },
}

/** All three line kinds, so the sigils and the colour steps can be read against one another. */
export const WithAnError: Story = {
  args: {
    ...heroTerminalDefinition.defaults,
    lines: [
      { text: 'npx motion-studio export --target next', kind: 'prompt' },
      { text: 'Reading document … 24 nodes, 3 breakpoints', kind: 'output' },
      { text: 'Missing alt text on 1 image', kind: 'error' },
      { text: 'Wrote 12 components · 4 routes · 1 theme', kind: 'output' },
    ],
  },
}
