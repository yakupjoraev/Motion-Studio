import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import { candy, midnight, studioDark, studioLight } from '../presets/index'
import { clearThemeCache, resolveTheme } from '../resolve/resolve-theme'
import { ThemeScope } from './theme-scope'

beforeEach(() => {
  clearThemeCache()
  document.documentElement.removeAttribute('style')
  document.documentElement.removeAttribute('data-color-mode')
})

describe('ThemeScope', () => {
  it('puts the theme on its own wrapper, not the root', () => {
    render(
      <ThemeScope theme={studioLight}>
        <span>preview</span>
      </ThemeScope>,
    )
    const wrapper = screen.getByText('preview').parentElement

    expect(wrapper?.style.getPropertyValue('--ms-color-surface-1')).toBe('oklch(100% 0 0)')
    expect(document.documentElement.style.getPropertyValue('--ms-color-surface-1')).toBe('')
  })

  it('sets the mode attribute on the wrapper', () => {
    render(
      <ThemeScope theme={midnight}>
        <span>preview</span>
      </ThemeScope>,
    )
    const wrapper = screen.getByText('preview').parentElement

    expect(wrapper?.dataset['colorMode']).toBe('dark')
    expect(wrapper?.dataset['elevation']).toBe('glow')
  })

  it('nests two levels, the inner shadowing the outer', () => {
    render(
      <ThemeScope theme={studioDark}>
        <div data-testid="outer">
          <ThemeScope theme={candy}>
            <span>inner</span>
          </ThemeScope>
        </div>
      </ThemeScope>,
    )

    const inner = screen.getByText('inner').parentElement
    const outer = screen.getByTestId('outer').parentElement

    expect(outer?.style.getPropertyValue('--ms-color-accent')).toBe(
      resolveTheme(studioDark).variables['--ms-color-accent'],
    )
    expect(inner?.style.getPropertyValue('--ms-color-accent')).toBe(
      resolveTheme(candy).variables['--ms-color-accent'],
    )
    expect(inner?.style.getPropertyValue('--ms-color-accent')).not.toBe(
      outer?.style.getPropertyValue('--ms-color-accent'),
    )
  })

  it('gives each nested scope its own mode, which is what a mixed gallery needs', () => {
    render(
      <ThemeScope theme={studioDark}>
        <div data-testid="outer">
          <ThemeScope theme={studioLight}>
            <span>inner</span>
          </ThemeScope>
        </div>
      </ThemeScope>,
    )

    expect(screen.getByTestId('outer').parentElement?.dataset['colorMode']).toBe('dark')
    expect(screen.getByText('inner').parentElement?.dataset['colorMode']).toBe('light')
  })

  it('passes a class through, so a preview can be shaped by its container', () => {
    render(
      <ThemeScope theme={studioDark} className="rounded-xl">
        <span>preview</span>
      </ThemeScope>,
    )

    expect(screen.getByText('preview').parentElement?.className).toBe('rounded-xl')
  })

  it('re-applies when the theme prop changes', () => {
    const { rerender } = render(
      <ThemeScope theme={studioDark}>
        <span>preview</span>
      </ThemeScope>,
    )

    rerender(
      <ThemeScope theme={candy}>
        <span>preview</span>
      </ThemeScope>,
    )

    expect(
      screen.getByText('preview').parentElement?.style.getPropertyValue('--ms-color-accent'),
    ).toBe(resolveTheme(candy).variables['--ms-color-accent'])
  })
})
