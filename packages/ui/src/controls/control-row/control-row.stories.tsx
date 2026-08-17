import type { Meta, StoryObj } from '@storybook/react'
import { type ReactElement, type ReactNode, useState } from 'react'

import { ScrubField } from '../scrub-field/index'
import { ControlRow } from './control-row'
import { controlRowDotStyles } from './control-row.styles'

const meta = {
  title: 'Controls/ControlRow',
  component: ControlRow,
  parameters: { layout: 'centered' },
  args: { label: 'Radius', children: () => null },
} satisfies Meta<typeof ControlRow>

export default meta

type Story = StoryObj<typeof meta>

/** A panel-width frame, because a row's layout is only readable at the width it will be used at. */
const Frame = ({ children }: { children: ReactNode }): ReactElement => (
  <div className="w-[300px] rounded-md border border-border bg-surface-1 p-2">{children}</div>
)

const NumberField = ({ label = 'Radius' }: { label?: string }): ReactElement => {
  const [value, setValue] = useState(16)

  return (
    <ScrubField
      label={label}
      value={value}
      unit="px"
      min={0}
      onChange={setValue}
      onCommit={setValue}
    />
  )
}

export const Default: Story = {
  render: (args) => (
    <Frame>
      <ControlRow {...args}>{() => <NumberField />}</ControlRow>
    </Frame>
  ),
}

/** The three states § Control rows defines, stacked so the reserved gutters line up. */
export const States: Story = {
  render: () => (
    <Frame>
      <ControlRow label="Radius">{() => <NumberField />}</ControlRow>
      <ControlRow label="Padding" modified onReset={() => undefined}>
        {() => <NumberField label="Padding" />}
      </ControlRow>
      <ControlRow
        description="Overridden at Medium"
        indicator={<span className={controlRowDotStyles()} title="Overridden at Medium" />}
        label="Gap"
        modified
        onReset={() => undefined}
      >
        {() => <NumberField label="Gap" />}
      </ControlRow>
      <ControlRow label="Blur" mixed>
        {(slot) => (
          <ScrubField
            label="Blur"
            labelledBy={slot.labelledBy}
            id={slot.id}
            mixed={slot.mixed}
            value={0}
            unit="px"
            onChange={() => undefined}
            onCommit={() => undefined}
          />
        )}
      </ControlRow>
    </Frame>
  ),
}

/** A long label truncates rather than pushing the control out of the panel. */
export const LongLabel: Story = {
  args: { label: 'Background attachment origin' },
  render: (args) => (
    <Frame>
      <ControlRow {...args}>{() => <NumberField />}</ControlRow>
    </Frame>
  ),
}
