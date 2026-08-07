import type { Meta, StoryObj } from '@storybook/react'
import type { ReactElement } from 'react'

import { ScrollArea } from './scroll-area'

const meta = {
  title: 'Chrome/ScrollArea',
  component: ScrollArea,
  parameters: { layout: 'centered' },
  args: { className: 'h-[200px] w-[240px] rounded-sm border border-border' },
} satisfies Meta<typeof ScrollArea>

export default meta

type Story = StoryObj<typeof meta>

const Rows = ({ count }: { count: number }): ReactElement => (
  <ul className="flex flex-col">
    {Array.from({ length: count }, (_, index) => `Layer ${index + 1}`).map((row) => (
      <li key={row} className="flex h-[26px] items-center px-2 text-foreground-muted text-xs">
        {row}
      </li>
    ))}
  </ul>
)

export const Vertical: Story = {
  args: { orientation: 'vertical', children: <Rows count={30} /> },
}

/** The layers tree pins its bar: a list whose length is invisible until you touch it cannot be judged. */
export const AlwaysVisible: Story = {
  args: { orientation: 'vertical', scrollbars: 'always', children: <Rows count={30} /> },
}

export const BothAxes: Story = {
  args: {
    children: (
      <div className="w-[480px]">
        <Rows count={30} />
      </div>
    ),
  },
}

/** Nothing to scroll: the frame must not reserve a gutter it will never use. */
export const NoOverflow: Story = { args: { children: <Rows count={3} /> } }
