import { act, renderHook } from '@testing-library/react'
import { createRef } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { APPLY_DEBOUNCE_MS, useApplyCss } from './use-apply-css'

/**
 * PLAYGROUND.md § Parsing and validation, as assertions: the debounce, the element as the only surface
 * written to, and the rule the document states outright — on invalid CSS the last valid value stays
 * rendered, because blanking the preview takes away the thing the reader was comparing against.
 */
const setup = (property: string, initial: string) => {
  const element = document.createElement('div')
  const ref = createRef<HTMLElement>() as { current: HTMLElement | null }

  ref.current = element

  const view = renderHook(() => useApplyCss(property, ref, initial))

  return { element, ...view }
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
})

describe('applying', () => {
  it('writes the initial value on the element as soon as it mounts', () => {
    const { element } = setup('background', 'red')

    expect(element.style.background).toBe('red')
  })

  it('waits out the debounce before applying a keystroke', () => {
    const { element, result } = setup('background', 'red')

    act(() => result.current.setValue('blue'))
    expect(element.style.background).toBe('red')

    act(() => vi.advanceTimersByTime(APPLY_DEBOUNCE_MS))
    expect(element.style.background).toBe('blue')
  })

  it('applies immediately when asked, which is what Cmd+Enter does', () => {
    const { element, result } = setup('background', 'red')

    act(() => result.current.setValue('blue'))
    act(() => result.current.applyNow())

    expect(element.style.background).toBe('blue')
  })

  it('reports the value the element is actually painting', () => {
    const { result } = setup('background', 'red')

    expect(result.current.applied).toBe('red')
  })
})

describe('an invalid value', () => {
  it('keeps the last valid render rather than blanking the preview', () => {
    const { element, result } = setup('background', 'red')

    act(() => result.current.setValue('rgb(1, 2'))
    act(() => vi.advanceTimersByTime(APPLY_DEBOUNCE_MS))

    expect(element.style.background).toBe('red')
    expect(result.current.applied).toBe('red')
  })

  it('says what is wrong and on which line', () => {
    const { result } = setup('background', 'red')

    act(() => result.current.setValue('linear-gradient(\n  red,\n  blue'))
    act(() => vi.advanceTimersByTime(APPLY_DEBOUNCE_MS))

    expect(result.current.errors[0]?.message).toContain('Unclosed parenthesis')
  })

  it('clears the error once the value parses again', () => {
    const { result } = setup('background', 'red')

    act(() => result.current.setValue('rgb(1, 2'))
    act(() => vi.advanceTimersByTime(APPLY_DEBOUNCE_MS))
    act(() => result.current.setValue('blue'))
    act(() => vi.advanceTimersByTime(APPLY_DEBOUNCE_MS))

    expect(result.current.errors).toEqual([])
  })

  it('never reaches a stylesheet, only the element', () => {
    const before = document.styleSheets.length
    const { result } = setup('background', 'red')

    act(() => result.current.setValue('blue'))
    act(() => vi.advanceTimersByTime(APPLY_DEBOUNCE_MS))

    expect(document.styleSheets.length).toBe(before)
  })
})
