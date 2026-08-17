import { createEmptyDocument, nodeId } from '@motion-studio/schema'
import { PRESETS, type ThemeConfig } from '@motion-studio/theme'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'

import { useStudioStore } from '../../../../store/editor-store'

import { STORAGE_KEY } from './custom-presets'
import { ThemeTab } from './theme-tab'

const state = () => useStudioStore.getState()

/** Pale amber on a light theme: it fails the accent pairs, and a darker step repairs it. */
const FAILING: ThemeConfig = {
  ...PRESETS['studio-light'],
  id: 'failing',
  name: 'Failing',
  palette: { ...PRESETS['studio-light'].palette, accent: 'oklch(88% 0.05 95)' },
}

let counter = 0

const nextId = () => {
  counter += 1

  return nodeId(`node_p${counter}`)
}

beforeEach(() => {
  window.localStorage.clear()

  act(() => {
    state().replaceDocument(createEmptyDocument({ ids: nextId }))
    state().applyThemePreset('studio-dark')
  })
})

describe('the theme panel', () => {
  it('shows every block of the builder', async () => {
    render(<ThemeTab />)

    expect(await screen.findByRole('radiogroup', { name: 'Mode' })).toBeInTheDocument()

    for (const label of ['Radius', 'Spacing', 'Motion', 'Elevation', 'Glass', 'Noise', 'Borders']) {
      expect(screen.getByRole('radiogroup', { name: label })).toBeInTheDocument()
    }

    expect(screen.getByRole('slider', { name: 'Hue shift' })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: 'Saturation' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Export tokens' })).toBeInTheDocument()
  })

  it('offers the ten shipped presets and applies one as a single command', async () => {
    const user = userEvent.setup()

    render(<ThemeTab />)

    const presets = await screen.findByTestId('theme-presets')

    expect(within(presets).getAllByRole('button')).toHaveLength(10)

    const before = state().history.past.length

    await user.click(within(presets).getByRole('button', { name: /Brutal/ }))

    expect(state().document.theme.id).toBe('brutal')
    expect(state().history.past.length - before).toBe(1)
  })

  it('changes a scale through a segmented control', async () => {
    const user = userEvent.setup()

    render(<ThemeTab />)

    const radius = await screen.findByRole('radiogroup', { name: 'Radius' })

    await user.click(within(radius).getByRole('radio', { name: '2' }))

    expect(state().document.theme.radiusScale).toBe(2)
  })
})

describe('the contrast report', () => {
  beforeEach(() => {
    act(() => state().setTheme(FAILING))
  })

  it('states the repair the engine made, with both ratios', async () => {
    render(<ThemeTab />)

    expect((await screen.findAllByText(/contrast repair/)).length).toBeGreaterThan(0)
    expect(screen.getByText(/needs 3:1|needs 4.5:1/)).toBeInTheDocument()
  })

  it('records "keep mine" in the config, and offers the way back', async () => {
    const user = userEvent.setup()

    render(<ThemeTab />)

    await user.click(await screen.findByRole('button', { name: 'Keep mine' }))

    expect(state().document.theme.palette.repairContrast).toBe(false)

    await user.click(await screen.findByRole('button', { name: 'Repair it' }))

    expect(state().document.theme.palette.repairContrast).toBe(true)
  })

  it('announces the summary in a live region', async () => {
    render(<ThemeTab />)

    const status = await screen.findByRole('status')

    await waitFor(() => expect(status).toHaveTextContent(/contrast/i))
  })
})

describe('saved presets', () => {
  it('round-trips save, rename and delete through localStorage', async () => {
    const user = userEvent.setup()

    render(<ThemeTab />)

    await user.click(await screen.findByRole('button', { name: 'Save as preset' }))
    await user.clear(screen.getByRole('textbox', { name: 'Preset name' }))
    await user.type(screen.getByRole('textbox', { name: 'Preset name' }), 'Night shift{Enter}')

    const saved = await screen.findByTestId('theme-saved-presets')

    expect(within(saved).getByRole('button', { name: 'Night shift' })).toBeInTheDocument()
    expect(window.localStorage.getItem(STORAGE_KEY)).toContain('Night shift')

    await user.click(within(saved).getByRole('button', { name: /actions/ }))
    await user.click(await screen.findByRole('menuitem', { name: 'Rename' }))
    await user.clear(screen.getByRole('textbox', { name: 'Preset name' }))
    await user.type(screen.getByRole('textbox', { name: 'Preset name' }), 'Day shift{Enter}')

    await waitFor(() => expect(window.localStorage.getItem(STORAGE_KEY)).toContain('Day shift'))

    await user.click(
      within(await screen.findByTestId('theme-saved-presets')).getByRole('button', {
        name: /actions/,
      }),
    )
    await user.click(await screen.findByRole('menuitem', { name: 'Delete' }))

    await waitFor(() => expect(screen.queryByTestId('theme-saved-presets')).toBeNull())
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('[]')
  })

  it('applies a saved preset as one command', async () => {
    const user = userEvent.setup()

    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([{ ...PRESETS.candy, id: 'saved-1', name: 'Mine' }]),
    )

    render(<ThemeTab />)

    const saved = await screen.findByTestId('theme-saved-presets')
    const before = state().history.past.length

    await user.click(within(saved).getByRole('button', { name: 'Mine' }))

    expect(state().document.theme.id).toBe('saved-1')
    expect(state().history.past.length - before).toBe(1)
  })
})

describe('the export dialog', () => {
  it('shows all four formats, carrying the same accent', async () => {
    const user = userEvent.setup()

    render(<ThemeTab />)

    await user.click(await screen.findByRole('button', { name: 'Export tokens' }))

    const dialog = await screen.findByRole('dialog')

    for (const label of ['CSS variables', 'Tailwind config', 'JSON', 'Figma Tokens']) {
      expect(within(dialog).getByRole('tab', { name: label })).toBeInTheDocument()
    }

    expect(within(dialog).getByTestId('token-format-css')).toHaveTextContent('--ms-color-accent')
  })
})
