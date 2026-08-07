import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { Panel, PanelHeader, PanelSection } from '../panel/index'

import { Resizable } from './resizable'

const meta = {
  title: 'Chrome/Resizable',
  component: Resizable,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Resizable>

export default meta

type Story = StoryObj<typeof meta>

/** § Layout: the inspector is 280–420 with a default of 320, and its handle is on its inner edge. */
export const Inspector: Story = {
  args: {
    'aria-label': 'Resize inspector',
    width: 320,
    min: 280,
    max: 420,
    onWidthChange: () => undefined,
    children: null,
  },
  render: () => {
    const [width, setWidth] = useState(320)

    return (
      <div className="flex h-[280px] items-stretch bg-canvas-bg">
        <div className="w-[240px]" />
        <Resizable
          aria-label="Resize inspector"
          side="left"
          width={width}
          min={280}
          max={420}
          onWidthChange={setWidth}
        >
          <Panel side="right" className="flex-1">
            <PanelHeader title={`Inspector · ${width}px`} />
            <PanelSection title="Layout" defaultOpen>
              <span className="text-foreground-muted text-xs">Drag the left edge.</span>
            </PanelSection>
          </Panel>
        </Resizable>
      </div>
    )
  },
}

/** The left panel is 240–360 with a default of 280, and its handle is on its right edge. */
export const LeftPanel: Story = {
  args: {
    'aria-label': 'Resize left panel',
    width: 280,
    min: 240,
    max: 360,
    onWidthChange: () => undefined,
    children: null,
  },
  render: () => {
    const [width, setWidth] = useState(280)

    return (
      <div className="flex h-[280px] items-stretch bg-canvas-bg">
        <Resizable
          aria-label="Resize left panel"
          side="right"
          width={width}
          min={240}
          max={360}
          onWidthChange={setWidth}
        >
          <Panel side="left" className="flex-1">
            <PanelHeader title={`Layers · ${width}px`} />
          </Panel>
        </Resizable>
        <div className="w-[240px]" />
      </div>
    )
  },
}
