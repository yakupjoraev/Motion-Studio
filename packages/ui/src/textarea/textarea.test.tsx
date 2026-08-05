import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../test/axe'

import { Textarea } from './textarea'

/**
 * jsdom reports `scrollHeight` as 0 for everything, so the growth cannot be observed by rendering text into
 * a real layout. It is stubbed per test with the height the content would occupy — the assertion is then
 * about the component's arithmetic and its bounds, which is the part this file owns.
 */
const stubScrollHeight = (value: number): void => {
  Object.defineProperty(HTMLTextAreaElement.prototype, 'scrollHeight', {
    configurable: true,
    get: () => value,
  })
}

/**
 * The metrics come from inline styles rather than a `getComputedStyle` stub: jsdom computes inline styles for
 * real, and stubbing the function breaks testing-library, which calls it too. Tailwind's padding is not
 * present in jsdom either way, so the field would otherwise measure with no padding at all.
 */
const STYLE = {
  lineHeight: '16px',
  paddingTop: '4px',
  paddingBottom: '4px',
  borderTopWidth: '1px',
  borderBottomWidth: '1px',
} as const

beforeEach(() => {
  stubScrollHeight(0)
})

describe('Textarea', () => {
  it('renders an editable multi-line field', () => {
    render(<Textarea style={STYLE} aria-label="Custom CSS" />)

    expect(screen.getByRole('textbox', { name: 'Custom CSS' })).toBeInTheDocument()
  })

  it('accepts typed text', async () => {
    render(<Textarea style={STYLE} aria-label="Custom CSS" />)

    await userEvent.type(screen.getByRole('textbox'), 'color: red')

    expect(screen.getByRole('textbox')).toHaveValue('color: red')
  })

  it('is reachable by Tab', async () => {
    render(<Textarea style={STYLE} aria-label="Custom CSS" />)

    await userEvent.tab()

    expect(screen.getByRole('textbox')).toHaveFocus()
  })

  it('never renders shorter than minRows', () => {
    stubScrollHeight(0)
    render(<Textarea style={STYLE} aria-label="Custom CSS" minRows={3} />)

    // 3 rows × 16 px line height + 10 px of padding and borders.
    expect(screen.getByRole('textbox').style.height).toBe('58px')
  })

  it('grows to fit its content', () => {
    stubScrollHeight(120)
    render(<Textarea style={STYLE} aria-label="Custom CSS" minRows={2} maxRows={12} />)

    expect(screen.getByRole('textbox').style.height).toBe('120px')
  })

  it('stops growing at maxRows and scrolls instead', () => {
    stubScrollHeight(900)
    render(<Textarea style={STYLE} aria-label="Custom CSS" minRows={2} maxRows={4} />)
    const field = screen.getByRole('textbox')

    // 4 rows × 16 px + 10 px, so a pasted stylesheet cannot push a panel off screen.
    expect(field.style.height).toBe('74px')
    expect(field.className).toContain('overflow-y-auto')
  })

  it('does not scroll while it still fits', () => {
    stubScrollHeight(60)
    render(<Textarea style={STYLE} aria-label="Custom CSS" maxRows={12} />)

    expect(screen.getByRole('textbox').className).not.toContain('overflow-y-auto')
  })

  it('re-measures when a controlled value changes', () => {
    stubScrollHeight(60)
    const { rerender } = render(
      <Textarea style={STYLE} aria-label="Custom CSS" value="one line" onChange={() => {}} />,
    )
    expect(screen.getByRole('textbox').style.height).toBe('60px')

    stubScrollHeight(140)
    rerender(
      <Textarea
        style={STYLE}
        aria-label="Custom CSS"
        value={'one\ntwo\nthree'}
        onChange={() => {}}
      />,
    )

    expect(screen.getByRole('textbox').style.height).toBe('140px')
  })

  it('still calls the caller onChange while resizing', async () => {
    const onChange = vi.fn()
    render(<Textarea style={STYLE} aria-label="Custom CSS" onChange={onChange} />)

    await userEvent.type(screen.getByRole('textbox'), 'ab')

    expect(onChange).toHaveBeenCalledTimes(2)
  })

  it('exposes the invalid state to assistive technology', () => {
    render(<Textarea style={STYLE} aria-label="Custom CSS" invalid />)

    expect(screen.getByRole('textbox')).toHaveAttribute('aria-invalid', 'true')
  })

  it('blocks typing when disabled', async () => {
    const onChange = vi.fn()
    render(<Textarea style={STYLE} aria-label="Custom CSS" disabled onChange={onChange} />)

    await userEvent.type(screen.getByRole('textbox'), 'x')

    expect(onChange).not.toHaveBeenCalled()
  })

  it('forwards its ref to the field', () => {
    const ref = { current: null as HTMLTextAreaElement | null }
    render(<Textarea ref={ref} style={STYLE} aria-label="Custom CSS" />)

    expect(ref.current).toBe(screen.getByRole('textbox'))
  })

  it('keeps a focus-ring replacement for the removed outline', () => {
    render(<Textarea style={STYLE} aria-label="Custom CSS" />)
    const className = screen.getByRole('textbox').className

    expect(className).toContain('outline-none')
    expect(className).toContain('focus-visible:shadow-focus')
  })

  it('is axe clean', async () => {
    const { container } = render(<Textarea style={STYLE} aria-label="Custom CSS" />)

    await expectNoViolations(container)
  })
})
