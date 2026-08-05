import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { midnight, studioDark, studioLight } from '../presets/index'
import { clearThemeCache, resolveTheme } from '../resolve/resolve-theme'
import { applyTheme, applyThemePartial, environmentMode, markThemeReady } from './apply-theme'

function stubPrefersDark(matches: boolean): void {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('dark') ? matches : false,
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }))
}

beforeEach(() => {
  clearThemeCache()
  document.documentElement.removeAttribute('style')
  document.documentElement.removeAttribute('data-color-mode')
  document.documentElement.removeAttribute('data-elevation')
  document.documentElement.removeAttribute('data-glass')
  document.documentElement.removeAttribute('data-theme-ready')
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('applyTheme', () => {
  it('writes every resolved variable onto the root', () => {
    const resolved = applyTheme(studioDark)
    const style = document.documentElement.style

    for (const [name, value] of Object.entries(resolved.variables)) {
      expect(style.getPropertyValue(name), name).toBe(value)
    }
  })

  it('writes the three attributes the generated stylesheet selects on', () => {
    applyTheme(midnight)
    const root = document.documentElement

    expect(root.dataset['colorMode']).toBe('dark')
    expect(root.dataset['elevation']).toBe('glow')
    expect(root.dataset['glass']).toBe('medium')
  })

  it('applies to any element, which is what scoped themes need', () => {
    const element = document.createElement('div')

    applyTheme(studioLight, { root: element })

    expect(element.style.getPropertyValue('--ms-color-surface-1')).toBe('oklch(100% 0 0)')
    expect(document.documentElement.style.getPropertyValue('--ms-color-surface-1')).toBe('')
  })

  it('does not re-render a subscriber', () => {
    // The zero-re-render property is the whole design of the styling layer, so it is a test, not a claim.
    const renders = { count: 0 }
    function Probe() {
      renders.count += 1

      return <div className="bg-surface-1" />
    }
    render(<Probe />)
    const before = renders.count

    applyTheme(midnight)

    expect(renders.count).toBe(before)
  })

  it('switches a whole document between two themes without touching React', () => {
    const renders = { count: 0 }
    function Probe() {
      renders.count += 1

      return <div className="bg-surface-1 text-foreground" />
    }
    render(<Probe />)
    const before = renders.count

    applyTheme(studioDark)
    applyTheme(studioLight)
    applyTheme(midnight)

    expect(renders.count).toBe(before)
  })
})

describe('environmentMode', () => {
  it('reads the system preference', () => {
    stubPrefersDark(true)
    expect(environmentMode()).toBe('dark')

    stubPrefersDark(false)
    expect(environmentMode()).toBe('light')
  })

  it('falls back to light where matchMedia is unavailable', () => {
    vi.stubGlobal('matchMedia', undefined)

    expect(environmentMode()).toBe('light')
  })

  it('resolves a system config against what it measured', () => {
    stubPrefersDark(true)
    const system = { ...studioDark, id: 'system-apply', colorMode: 'system' as const }

    expect(applyTheme(system).mode).toBe('dark')
    expect(document.documentElement.dataset['colorMode']).toBe('dark')
  })
})

describe('applyThemePartial', () => {
  it('writes only the keys it was given', () => {
    const resolved = resolveTheme(studioDark)

    applyThemePartial(['--ms-color-accent'], resolved)
    const style = document.documentElement.style

    expect(style.getPropertyValue('--ms-color-accent')).toBe(
      resolved.variables['--ms-color-accent'],
    )
    expect(style.getPropertyValue('--ms-color-surface-1')).toBe('')
  })

  it('skips a key the resolution does not carry rather than writing undefined', () => {
    const resolved = resolveTheme(studioDark)

    applyThemePartial(['--ms-not-a-token'], resolved)

    expect(document.documentElement.style.getPropertyValue('--ms-not-a-token')).toBe('')
  })

  it('accepts a scoped root', () => {
    const element = document.createElement('div')
    const resolved = resolveTheme(studioDark)

    applyThemePartial(['--ms-color-accent'], resolved, { root: element })

    expect(element.style.getPropertyValue('--ms-color-accent')).not.toBe('')
  })
})

describe('markThemeReady', () => {
  it('sets the gate attribute after a frame, so the first paint never animates', async () => {
    markThemeReady()

    expect(document.documentElement.dataset['themeReady']).toBeUndefined()

    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))

    expect(document.documentElement.dataset['themeReady']).toBe('true')
  })
})
