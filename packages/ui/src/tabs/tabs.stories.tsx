import { LayoutGridIcon, ListIcon, PaletteIcon } from '@motion-studio/icons'
import type { Meta, StoryObj } from '@storybook/react'
import { useState } from 'react'

import { Tabs } from './tabs'

const meta = {
  title: 'Chrome/Tabs',
  component: Tabs,
  parameters: { layout: 'centered' },
  args: { 'aria-label': 'Panel', className: 'w-[320px]' },
} satisfies Meta<typeof Tabs>

export default meta

type Story = StoryObj<typeof meta>

const PANEL = 'p-3 text-xs text-foreground-muted'

export const Default: Story = {
  args: {
    defaultValue: 'design',
    items: [
      { value: 'design', label: 'Design', content: <div className={PANEL}>Design</div> },
      { value: 'layers', label: 'Layers', content: <div className={PANEL}>Layers</div> },
      { value: 'assets', label: 'Assets', content: <div className={PANEL}>Assets</div> },
    ],
  },
}

export const WithIcons: Story = {
  args: {
    defaultValue: 'design',
    items: [
      {
        value: 'design',
        label: 'Design',
        icon: <PaletteIcon />,
        content: <div className={PANEL}>Design</div>,
      },
      {
        value: 'layers',
        label: 'Layers',
        icon: <ListIcon />,
        content: <div className={PANEL}>Layers</div>,
      },
      {
        value: 'assets',
        label: 'Assets',
        icon: <LayoutGridIcon />,
        content: <div className={PANEL}>Assets</div>,
      },
    ],
  },
}

export const WithADisabledTab: Story = {
  args: {
    defaultValue: 'design',
    items: [
      { value: 'design', label: 'Design', content: <div className={PANEL}>Design</div> },
      { value: 'layers', label: 'Layers', content: <div className={PANEL}>Layers</div> },
      { value: 'assets', label: 'Assets', disabled: true },
    ],
  },
}

/** The underline's travel is the point of the component, so one story drives it. */
export const Controlled: Story = {
  args: { items: [] },
  render: () => {
    const [value, setValue] = useState('design')

    return (
      <Tabs
        aria-label="Panel"
        className="w-[320px]"
        value={value}
        onValueChange={setValue}
        items={[
          { value: 'design', label: 'Design', content: <div className={PANEL}>Design</div> },
          { value: 'layers', label: 'Layers', content: <div className={PANEL}>Layers</div> },
          { value: 'assets', label: 'Assets', content: <div className={PANEL}>Assets</div> },
        ]}
      />
    )
  },
}
