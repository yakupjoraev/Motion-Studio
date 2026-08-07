import { MoreHorizontalIcon, ReplayIcon } from '@motion-studio/icons'
import type { Meta, StoryObj } from '@storybook/react'
import { type ReactElement, type ReactNode, useState } from 'react'

import { Button } from '../button/index'
import { Input } from '../input/index'
import { ScrollArea } from '../scroll-area/index'
import { Select } from '../select/index'
import { LABEL_COLUMN_CLASS } from '../styles/density'
import { Switch } from '../switch/index'

import { Panel, PanelHeader, PanelSection } from './panel'

const meta = {
  title: 'Chrome/Panel',
  component: Panel,
  parameters: { layout: 'centered' },
} satisfies Meta<typeof Panel>

export default meta

type Story = StoryObj<typeof meta>

const Row = ({ label, children }: { label: string; children: ReactNode }): ReactElement => (
  <div className="flex h-[28px] items-center gap-2">
    <span className={`${LABEL_COLUMN_CLASS} shrink-0 text-foreground-muted text-xs`}>{label}</span>
    {children}
  </div>
)

export const Frame: Story = {
  args: {
    side: 'right',
    className: 'h-[320px] w-[320px]',
    children: (
      <>
        <PanelHeader
          title="Inspector"
          action={
            <Button variant="ghost" size="icon" aria-label="Panel options">
              <MoreHorizontalIcon />
            </Button>
          }
        />
        <PanelSection title="Layout" defaultOpen>
          <Row label="Display">
            <Select
              aria-label="Display"
              defaultValue="flex"
              options={[
                { value: 'flex', label: 'flex' },
                { value: 'grid', label: 'grid' },
              ]}
            />
          </Row>
          <Row label="Gap">
            <Input aria-label="Gap" defaultValue="16" suffix="px" />
          </Row>
        </PanelSection>
        <PanelSection title="Effects">
          <Row label="Blur">
            <Input aria-label="Blur" defaultValue="8" suffix="px" />
          </Row>
        </PanelSection>
      </>
    ),
  },
}

/** § Section headers: the reset appears only when the section differs from the block default. */
export const WithAResetAction: Story = {
  args: {
    side: 'right',
    className: 'h-[200px] w-[320px]',
    children: (
      <PanelSection
        title="Layout"
        defaultOpen
        action={
          <Button variant="ghost" size="icon" aria-label="Reset Layout">
            <ReplayIcon />
          </Button>
        }
      >
        <Row label="Snap">
          <Switch aria-label="Snap to grid" defaultChecked />
        </Row>
      </PanelSection>
    ),
  },
}

/** Section headers stick while the panel scrolls, which is the point of the sticky rule. */
export const Scrolling: Story = {
  args: { side: 'right', className: 'h-[280px] w-[320px]', children: null },
  render: () => {
    const [open, setOpen] = useState('Layout')

    return (
      <Panel side="right" className="h-[280px] w-[320px]">
        <PanelHeader title="Inspector" />
        <ScrollArea className="min-h-0 flex-1">
          {['Layout', 'Typography', 'Effects', 'Motion', 'Export'].map((section) => (
            <PanelSection
              key={section}
              title={section}
              open={open === section}
              onOpenChange={(next) => setOpen(next ? section : '')}
            >
              {Array.from({ length: 4 }, (_, index) => `${section} ${index + 1}`).map((row) => (
                <Row key={row} label={row}>
                  <Input aria-label={row} defaultValue="0" />
                </Row>
              ))}
            </PanelSection>
          ))}
        </ScrollArea>
      </Panel>
    )
  },
}
