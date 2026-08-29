import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { EDITOR_HEIGHT, EditorSkeleton } from './editor-skeleton'
import { PresetPanel, appendLayer } from './preset-panel'
import { PRESETS } from './presets'
import { PLAYGROUND_PROPERTIES, type PlaygroundProperty } from './properties'
import { PropertyList } from './property-list'
import { TargetFrame } from './target-frame'
import { PropertyTarget } from './targets/property-target'

/**
 * The pieces of the playground that hold a rule: the radiogroup's keyboard model, the preset panel's
 * replace-or-append, the frame's keyboard resize, and every sandbox rendering its own target.
 */
describe('the property list', () => {
  it('is a radiogroup with one property checked', () => {
    render(<PropertyList value="background" onValueChange={vi.fn()} />)

    expect(screen.getByRole('radiogroup', { name: 'CSS property' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /background/ })).toBeChecked()
  })

  it('keeps only the current option in the tab order', () => {
    render(<PropertyList value="filter" onValueChange={vi.fn()} />)

    expect(screen.getByRole('radio', { name: /^filter/ })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('radio', { name: /^background/ })).toHaveAttribute('tabindex', '-1')
  })

  it('moves to the next property on an arrow key', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()

    render(<PropertyList value="background" onValueChange={onValueChange} />)
    await user.click(screen.getByRole('radio', { name: /^background/ }))
    await user.keyboard('{ArrowDown}')

    expect(onValueChange).toHaveBeenLastCalledWith('box-shadow')
  })

  it('wraps from the last property back to the first', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()

    render(<PropertyList value="transition" onValueChange={onValueChange} />)
    await user.click(screen.getByRole('radio', { name: /^transition/ }))
    await user.keyboard('{ArrowDown}')

    expect(onValueChange).toHaveBeenLastCalledWith('background')
  })
})

describe('the preset panel', () => {
  it('replaces the value on a click', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()

    render(
      <PresetPanel
        property="box-shadow"
        value="0 0 0 red"
        onValueChange={onValueChange}
        onCopy={vi.fn()}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Soft lift' }))

    expect(onValueChange).toHaveBeenCalledWith(PRESETS['box-shadow'][0]?.value)
  })

  it('appends a layer on Alt-click where the property is layerable', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()

    render(
      <PresetPanel
        property="box-shadow"
        value="0 0 0 red"
        onValueChange={onValueChange}
        onCopy={vi.fn()}
      />,
    )
    await user.keyboard('{Alt>}')
    await user.click(screen.getByRole('button', { name: 'Soft lift' }))
    await user.keyboard('{/Alt}')

    expect(onValueChange).toHaveBeenCalledWith(expect.stringContaining('0 0 0 red,'))
  })

  it('replaces even on Alt-click where the property takes one value', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()

    render(
      <PresetPanel
        property="clip-path"
        value="circle(40%)"
        onValueChange={onValueChange}
        onCopy={vi.fn()}
      />,
    )
    await user.keyboard('{Alt>}')
    await user.click(screen.getByRole('button', { name: 'Hexagon' }))
    await user.keyboard('{/Alt}')

    expect(onValueChange).toHaveBeenCalledWith(PRESETS['clip-path'][0]?.value)
  })

  it('hides the swatch from the accessible name', () => {
    render(<PresetPanel property="background" value="" onValueChange={vi.fn()} onCopy={vi.fn()} />)

    for (const swatch of screen.getAllByTestId('preset-swatch')) {
      expect(swatch).toHaveAttribute('aria-hidden', 'true')
    }
  })

  it('names every preset the document lists', () => {
    for (const property of PLAYGROUND_PROPERTIES) {
      expect(PRESETS[property].length).toBeGreaterThan(0)
    }
  })
})

describe('appendLayer', () => {
  it('starts the list when there is nothing to append to', () => {
    expect(appendLayer('', 'red')).toBe('red')
  })

  it('adds a comma and a new line', () => {
    expect(appendLayer('red', 'blue')).toBe('red,\n  blue')
  })

  it('does not double a trailing comma', () => {
    expect(appendLayer('red,', 'blue')).toBe('red,\n  blue')
  })
})

describe('the target frame', () => {
  it('announces its size', () => {
    render(
      <TargetFrame>
        <div />
      </TargetFrame>,
    )

    expect(screen.getByRole('status')).toHaveTextContent('640 by 400 pixels')
  })

  it('resizes on an arrow key and says the new size', async () => {
    const user = userEvent.setup()

    render(
      <TargetFrame>
        <div />
      </TargetFrame>,
    )

    screen.getByTestId('target-frame-handle-x').focus()
    await user.keyboard('{ArrowRight}')

    expect(screen.getByRole('status')).toHaveTextContent('656 by 400 pixels')
    expect(screen.getByTestId('target-frame')).toHaveStyle({ width: '656px' })
  })

  it('takes a bigger step with Shift', async () => {
    const user = userEvent.setup()

    render(
      <TargetFrame>
        <div />
      </TargetFrame>,
    )

    screen.getByTestId('target-frame-handle-y').focus()
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}')

    expect(screen.getByRole('status')).toHaveTextContent('640 by 464 pixels')
  })

  it('will not shrink below the minimum', async () => {
    const user = userEvent.setup()

    render(
      <TargetFrame initialWidth={170} initialHeight={200}>
        <div />
      </TargetFrame>,
    )

    screen.getByTestId('target-frame-handle-x').focus()
    await user.keyboard('{ArrowLeft}')

    expect(screen.getByTestId('target-frame')).toHaveStyle({ width: '160px' })
  })
})

describe('every sandbox', () => {
  it.each(PLAYGROUND_PROPERTIES)('renders a target for %s', (property: PlaygroundProperty) => {
    render(
      <PropertyTarget
        property={property}
        targetRef={{ current: null }}
        applied=""
        initialStyle={{}}
      />,
    )

    expect(screen.getByTestId('playground-target')).toBeInTheDocument()
  })

  it('gives the mask sandbox a second panel for the mask itself', async () => {
    const user = userEvent.setup()

    render(
      <PropertyTarget
        property="mask-image"
        targetRef={{ current: null }}
        applied="linear-gradient(black, transparent)"
        initialStyle={{}}
      />,
    )
    await user.click(screen.getByRole('radio', { name: 'Both' }))

    expect(screen.getByTestId('playground-mask-view')).toBeInTheDocument()
  })
})

describe('the editor skeleton', () => {
  it('reserves the editor’s exact height, so nothing shifts when it lands', () => {
    render(<EditorSkeleton />)

    expect(screen.getByTestId('editor-skeleton')).toHaveStyle({ height: `${EDITOR_HEIGHT}px` })
  })
})
