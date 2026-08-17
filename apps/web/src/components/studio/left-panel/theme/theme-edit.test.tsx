import { createEmptyDocument, nodeId } from '@motion-studio/schema'
import { PRESETS } from '@motion-studio/theme'
import { act, render, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { useStudioStore } from '../../../../store/editor-store'
import { CanvasHost } from '../../canvas-area/canvas-host'

import { ThemeHost } from './theme-host'
import { useThemeEdit } from './use-theme-edit'

const state = () => useStudioStore.getState()

const canvasRenders = (): number =>
  (window as unknown as { __canvasRenders?: number }).__canvasRenders ?? 0

const variable = (name: string): string =>
  document.documentElement.style.getPropertyValue(name).trim()

let counter = 0

const nextId = () => {
  counter += 1

  return nodeId(`node_t${counter}`)
}

beforeEach(() => {
  act(() => {
    state().replaceDocument(createEmptyDocument({ ids: nextId }))
    state().applyThemePreset('studio-dark')
  })

  document.documentElement.removeAttribute('style')
})

/**
 * The two-write pattern, as the prompt states it: the variables land now, the command lands on
 * release, and the canvas never renders for either.
 */
describe('a theme control', () => {
  it('writes the affected variables without touching the store', () => {
    const { result } = renderHook(() => useThemeEdit())
    const version = state().version

    act(() => result.current.preview('radiusScale', 2))

    expect(variable('--ms-radius-lg')).toBe('24px')
    expect(state().version).toBe(version)
    expect(state().document.theme.radiusScale).toBe(1)
  })

  it('writes only what moved', () => {
    const { result } = renderHook(() => useThemeEdit())

    act(() => result.current.preview('radiusScale', 2))

    // A radius change is nine properties out of 141; the colours are not among them.
    expect(variable('--ms-color-accent')).toBe('')
  })

  it('makes the commit an undoable change that the document carries', () => {
    const { result } = renderHook(() => useThemeEdit())

    act(() => result.current.commit('radiusScale', 2))

    expect(state().document.theme.radiusScale).toBe(2)

    act(() => state().undo())

    expect(state().document.theme.radiusScale).toBe(1)
  })

  it('collapses a hundred frames of a drag into one history entry', () => {
    const { result } = renderHook(() => useThemeEdit())
    const before = state().history.past.length

    act(() => {
      for (let step = 0; step < 100; step += 1) {
        result.current.preview('palette.accentHueShift', -30 + step * 0.6)
        result.current.commit('palette.accentHueShift', -30 + step * 0.6)
      }
    })

    expect(state().history.past.length - before).toBe(1)
    expect(state().document.theme.palette.accentHueShift).toBeCloseTo(29.4)
  })

  it('renders the canvas zero times, dragging and committing', () => {
    render(<CanvasHost />)

    const { result } = renderHook(() => useThemeEdit())
    const before = canvasRenders()

    act(() => {
      for (let step = 0; step < 100; step += 1) {
        result.current.preview('palette.saturation', 0.5 + step * 0.01)
      }

      result.current.commit('palette.saturation', 1.4)
    })

    expect(canvasRenders() - before).toBe(0)
    expect(state().document.theme.palette.saturation).toBeCloseTo(1.4)
  })
})

describe('applying a preset', () => {
  it('is one command however many tokens it moves', () => {
    const before = state().history.past.length

    act(() => state().applyThemePreset('brutal'))

    expect(state().history.past.length - before).toBe(1)
    expect(state().document.theme).toEqual(PRESETS.brutal)

    act(() => state().undo())

    expect(state().document.theme).toEqual(PRESETS['studio-dark'])
  })
})

describe('ThemeHost', () => {
  it('puts the document theme on the root and keeps it there', () => {
    render(<ThemeHost />)

    expect(variable('--ms-radius-lg')).toBe('12px')

    act(() => state().applyThemePreset('brutal'))

    expect(variable('--ms-radius-lg')).toBe('0px')
    expect(document.documentElement.dataset['colorMode']).toBe('light')
    expect(document.documentElement.dataset['elevation']).toBe('sharp')
  })
})
