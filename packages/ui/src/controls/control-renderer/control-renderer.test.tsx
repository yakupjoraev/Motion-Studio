import { CONTROL_KINDS, type ControlDescriptor, type ControlKind } from '@motion-studio/schema'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../../test/axe'
import { ControlRow } from '../control-row/index'

import { gradientToCss } from '../gradient-field/index'

import { ControlRenderer } from './control-renderer'
import { asGradient } from './gradient-control'

const descriptor = (
  kind: ControlKind,
  over: Partial<ControlDescriptor> = {},
): ControlDescriptor => ({
  path: 'value',
  kind,
  label: 'Value',
  ...over,
})

const OPTIONS = {
  options: [
    { value: 'one', label: 'One' },
    { value: 'two', label: 'Two' },
  ],
}

/** A legal value per kind, in the shape a block would store it in. */
const VALUES: Readonly<Record<ControlKind, unknown>> = {
  text: 'Hello',
  textarea: 'Hello',
  richText: '<p>Hello</p>',
  number: 16,
  slider: 16,
  stepper: 2,
  select: 'one',
  segmented: 'one',
  switch: true,
  color: 'accent',
  gradient: 'linear-gradient(180deg, #000 0%, #fff 100%)',
  shadow: [{ x: 0, y: 2, blur: 8, spread: 0, color: '#000000', inset: false }],
  spacing: { top: 4, right: 4, bottom: 4, left: 4 },
  radius: { topLeft: 4, topRight: 4, bottomRight: 4, bottomLeft: 4 },
  align: { horizontal: 'start', vertical: 'center' },
  font: { family: 'inter', size: 16, weight: 400, tracking: 0 },
  image: { src: '', alt: '' },
  icon: 'plus',
  link: { href: 'https://example.com', target: '_self', rel: [] },
  list: [{ label: 'One' }],
  motion: null,
  effect: null,
  css: 'color: red;',
}

const OPTIONS_BY_KIND: Partial<Record<ControlKind, ControlDescriptor['options']>> = {
  select: OPTIONS,
  segmented: OPTIONS,
  list: { labelKey: 'label', itemTemplate: { label: '' }, itemControls: [] },
}

const renderKind = (kind: ControlKind) =>
  render(
    <ControlRow label="Value">
      {(slot) => (
        <ControlRenderer
          descriptor={descriptor(kind, {
            ...(OPTIONS_BY_KIND[kind] === undefined ? {} : { options: OPTIONS_BY_KIND[kind] }),
          })}
          onChange={() => undefined}
          onCommit={() => undefined}
          slot={slot}
          value={VALUES[kind]}
        />
      )}
    </ControlRow>,
  )

beforeEach(() => {
  Element.prototype.hasPointerCapture = vi.fn(() => false)
  Element.prototype.releasePointerCapture = vi.fn()
  Element.prototype.scrollIntoView = vi.fn()
})

describe('ControlRenderer', () => {
  it.each(CONTROL_KINDS.map((kind) => [kind] as const))('renders the %s kind', async (kind) => {
    const { container } = renderKind(kind)

    await waitFor(() => {
      expect(container.textContent === null || container.firstElementChild).toBeTruthy()
    })

    // Nothing renders an empty row: either a control or, for the two unbuilt kinds, the note.
    expect(container.querySelector('[data-testid="control-row"]')?.textContent).not.toBe('Value')
  })

  it('covers every kind in CONTROL_KINDS, so a new one breaks the build here first', () => {
    expect(Object.keys(VALUES).sort()).toEqual([...CONTROL_KINDS].sort())
  })

  it('names the two kinds whose controls are not built yet — ADR-109', async () => {
    renderKind('motion')

    // The switch is a chunk of its own, so every one of these waits for it once.
    expect(await screen.findByTestId('control-unbuilt')).toHaveTextContent('motion engine')
  })

  it('takes the row’s label as the control’s accessible name', async () => {
    renderKind('text')

    expect(await screen.findByRole('textbox', { name: 'Value' })).toBeInTheDocument()
  })

  it('reports an edit as a change and a commit', async () => {
    const onChange = vi.fn()
    const onCommit = vi.fn()

    render(
      <ControlRow label="Title">
        {(slot) => (
          <ControlRenderer
            descriptor={descriptor('text')}
            onChange={onChange}
            onCommit={onCommit}
            slot={slot}
            value="Hello"
          />
        )}
      </ControlRow>,
    )

    await userEvent.type(await screen.findByRole('textbox'), '!')
    await userEvent.tab()

    expect(onChange).toHaveBeenCalledWith('Hello!')
    expect(onCommit).toHaveBeenCalledWith('Hello!')
  })

  it('turns a gradient prop into the editor’s shape and back into CSS', () => {
    // The prop is the CSS a block renders; the editor works on the parsed form and commits CSS back.
    const parsed = asGradient(VALUES.gradient)

    expect(parsed.kind).toBe('linear')
    expect(gradientToCss(parsed)).toContain('linear-gradient')
    // Anything unparseable is an empty linear ramp rather than a control with no value to hold.
    expect(asGradient('not a gradient')).toMatchObject({ kind: 'linear' })
    expect(gradientToCss(asGradient('not a gradient'))).toContain('linear-gradient')
  })

  it('reads a value of the wrong shape as empty rather than as NaN', async () => {
    render(
      <ControlRenderer
        descriptor={descriptor('number')}
        onChange={() => undefined}
        onCommit={() => undefined}
        value="not a number"
      />,
    )

    expect(await screen.findByRole('spinbutton')).toHaveAttribute('aria-valuenow', '0')
  })

  it('is axe clean across every kind', async () => {
    for (const kind of CONTROL_KINDS) {
      const { container, unmount } = renderKind(kind)

      await expectNoViolations(container)
      unmount()
    }
  })
})
