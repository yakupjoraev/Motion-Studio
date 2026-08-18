import { COLOR_MODE_STORAGE_KEY } from '@motion-studio/theme'
import { screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { ThemeToggle } from './theme-toggle'
import { COLOR_MODE_MODULE } from './theme-toggle.codegen'
import { themeToggleDefinition as definition } from './theme-toggle.definition'
import { visibleChoices } from './theme-toggle.schema'

const defaults = definition.defaults

const root = (): HTMLElement => document.documentElement

beforeEach(() => {
  localStorage.clear()
  root().removeAttribute('data-color-mode')
})

afterEach(() => {
  localStorage.clear()
  root().removeAttribute('data-color-mode')
})

describe('the choices offered', () => {
  it('is three, or two without the system option', () => {
    expect(visibleChoices(true)).toEqual(['light', 'dark', 'system'])
    expect(visibleChoices(false)).toEqual(['light', 'dark'])
  })
})

describe('ThemeToggle', () => {
  it('is a labelled group of three pressable choices', () => {
    renderBlock(definition, ThemeToggle)

    expect(screen.getByRole('group', { name: defaults.ariaLabel })).toBeInTheDocument()
    expect(screen.getAllByTestId('theme-toggle-choice')).toHaveLength(3)
    expect(screen.getByRole('button', { name: defaults.systemLabel })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('drops the system choice when it is not offered', () => {
    renderBlock(definition, ThemeToggle, { includeSystem: false })

    expect(screen.queryByRole('button', { name: defaults.systemLabel })).toBeNull()
    expect(screen.getAllByTestId('theme-toggle-choice')).toHaveLength(2)
  })

  /* ADR-200: the block calls the theme engine, and the engine owns the attribute and the storage key. */
  it.each([
    ['light', 'lightLabel'],
    ['dark', 'darkLabel'],
  ] as const)('writes %s to the root and to storage', async (mode, labelKey) => {
    renderBlock(definition, ThemeToggle)

    await userEvent.click(screen.getByRole('button', { name: defaults[labelKey] }))

    expect(root().dataset['colorMode']).toBe(mode)
    expect(localStorage.getItem(COLOR_MODE_STORAGE_KEY)).toBe(mode)
    expect(screen.getByRole('button', { name: defaults[labelKey] })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('clears both for System, which is what lets the page follow the operating system again', async () => {
    renderBlock(definition, ThemeToggle)

    await userEvent.click(screen.getByRole('button', { name: defaults.darkLabel }))
    await userEvent.click(screen.getByRole('button', { name: defaults.systemLabel }))

    expect(root().hasAttribute('data-color-mode')).toBe(false)
    expect(localStorage.getItem(COLOR_MODE_STORAGE_KEY)).toBeNull()
  })

  it('starts on the stored preference rather than on System', () => {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, 'dark')

    renderBlock(definition, ThemeToggle)

    expect(screen.getByRole('button', { name: defaults.darkLabel })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    expect(screen.getByRole('button', { name: defaults.systemLabel })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
  })

  it('keeps a name on every choice in the icons variant', () => {
    renderBlock(definition, ThemeToggle, { variant: 'icons' })

    for (const label of [defaults.lightLabel, defaults.darkLabel, defaults.systemLabel]) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    }
  })

  it('is operable by keyboard alone', async () => {
    renderBlock(definition, ThemeToggle)

    await userEvent.tab()
    await userEvent.tab()
    await userEvent.keyboard('{Enter}')

    expect(root().dataset['colorMode']).toBe('dark')
  })

  it('carries the pressed state as a surface and a weight, not only a colour', () => {
    renderBlock(definition, ThemeToggle)

    const [first] = screen.getAllByTestId('theme-toggle-choice')

    expect(first?.className).toContain('aria-pressed:bg-surface-3')
    expect(first?.className).toContain('aria-pressed:font-semibold')
  })

  it('hides itself with the responsive visibility class', () => {
    renderBlock(definition, ThemeToggle, { hidden: true })

    expect(screen.getByTestId('theme-toggle').className).toContain('hidden')
  })

  it('has no axe violations, in either variant', async () => {
    for (const variant of ['segmented', 'icons'] as const) {
      const { container } = renderBlock(definition, ThemeToggle, { variant })

      await expectNoViolations(container)
    }
  })
})

/**
 * ADR-201, as assertions. The export cannot import `@motion-studio/theme` — the user's project has never heard
 * of it — so the descriptor carries the module, and these are what stop it drifting from the real one.
 */
describe('the exported runtime module', () => {
  const source = COLOR_MODE_MODULE.source

  it('is declared by the descriptor and imported by the component it emits', () => {
    expect(definition.codegen.runtimeModule).toBe(COLOR_MODE_MODULE)
    expect(definition.codegen.imports?.[0]?.from).toContain('color-mode')
    expect(definition.codegen.imports?.[0]?.named).toContain('setColorMode')
  })

  it('uses the same storage key as the theme engine', () => {
    expect(source).toContain(COLOR_MODE_STORAGE_KEY)
  })

  it('writes the attribute the generated stylesheet selects on', () => {
    expect(source).toContain('data-color-mode')
    expect(source).toContain('dataset.colorMode')
  })

  it('treats system as the absence of both, which is what ADR-026 requires', () => {
    expect(source).toContain("removeAttribute('data-color-mode')")
    expect(source).toContain('removeItem(COLOR_MODE_STORAGE_KEY)')
  })

  it('ships the blocking script that prevents a flash on reload', () => {
    expect(COLOR_MODE_MODULE.named).toContain('COLOR_MODE_SCRIPT')
    expect(source).toContain('COLOR_MODE_SCRIPT')
    expect(source).toContain('localStorage.getItem')
  })

  it('is self-contained: it imports nothing at all', () => {
    expect(source).not.toContain('@motion-studio')
    expect(source).not.toMatch(/^import /m)
  })

  it('adds no dependency to the emitted project', () => {
    expect(definition.codegen.dependencies).toBeUndefined()
  })

  it('lands somewhere a Next project already has a directory for', () => {
    expect(COLOR_MODE_MODULE.path).toBe('lib/color-mode.ts')
  })
})
