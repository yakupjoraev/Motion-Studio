import type { Meta, StoryObj } from '@storybook/react'

import { Stat } from './stat'
import { statDefinition } from './stat.definition'

const meta = {
  title: 'Blocks/Content/Stat',
  component: Stat,
  parameters: { layout: 'padded' },
} satisfies Meta<typeof Stat>

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = { args: statDefinition.defaults }

export const Rising: Story = { args: statDefinition.previewProps }

/** The case that needs the direction prop: the number went down and that is the good news. */
export const FallingIsGood: Story = {
  args: {
    ...statDefinition.defaults,
    value: '0.4%',
    label: 'Error rate',
    delta: '−58%',
    deltaDirection: 'down-is-good',
    deltaRose: false,
  },
}

export const WithoutSparkline: Story = {
  args: { ...statDefinition.defaults, showSparkline: false },
}

export const Centred: Story = { args: { ...statDefinition.defaults, align: 'center', size: 'xl' } }
