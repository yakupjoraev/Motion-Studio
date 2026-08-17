import type { Meta, StoryObj } from '@storybook/react'

import { BentoGrid } from './bento-grid'
import { bentoGridDefinition } from './bento-grid.definition'

const meta = {
  title: 'Blocks/Marketing/Bento grid',
  component: BentoGrid,
  parameters: { layout: 'fullscreen' },
} satisfies Meta<typeof BentoGrid>

export default meta

type Story = StoryObj<typeof meta>

/** A cell holds whatever a user drops in it; the stories stand in for that with plain markup. */
const cellContent = (label: string) => (
  <>
    <p className="m-0 font-semibold text-foreground text-lg">{label}</p>
    <p className="m-0 text-foreground-muted text-sm">
      Whatever the user placed in this cell renders here.
    </p>
  </>
)

const filled = ['Canvas', 'Motion', 'Themes', 'Export', 'Blocks', 'Playground'].map((label) => (
  <div key={label}>{cellContent(label)}</div>
))

export const Default: Story = {
  args: bentoGridDefinition.defaults,
  render: (args) => <BentoGrid {...args}>{filled}</BentoGrid>,
}

export const Empty: Story = { args: bentoGridDefinition.defaults }

export const Gapless: Story = {
  args: { ...bentoGridDefinition.defaults, gapless: true },
  render: (args) => <BentoGrid {...args}>{filled}</BentoGrid>,
}

export const TallCells: Story = {
  args: { ...bentoGridDefinition.defaults, cellHeight: 'lg' },
  render: (args) => <BentoGrid {...args}>{filled}</BentoGrid>,
}
