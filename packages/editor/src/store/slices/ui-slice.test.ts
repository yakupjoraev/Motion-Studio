import { describe, expect, it } from 'vitest'

import { createTestStore } from '../../test/create-test-store'

import { PANEL_BOUNDS } from './ui-slice'

describe('panels', () => {
  it('switches the left tab', () => {
    const store = createTestStore()

    store.getState().setLeftTab('layers')

    expect(store.getState().ui.leftPanel.tab).toBe('layers')
  })

  it('clamps a width to the bounds of its side', () => {
    const store = createTestStore()

    store.getState().setPanelWidth('left', 40)
    store.getState().setPanelWidth('right', 9000)

    expect(store.getState().ui.leftPanel.width).toBe(PANEL_BOUNDS.left.min)
    expect(store.getState().ui.rightPanel.width).toBe(PANEL_BOUNDS.right.max)
  })

  it('keeps a width inside the bounds', () => {
    const store = createTestStore()

    store.getState().setPanelWidth('left', 300)

    expect(store.getState().ui.leftPanel.width).toBe(300)
  })

  it('collapses each side independently', () => {
    const store = createTestStore()

    store.getState().togglePanel('left')

    expect(store.getState().ui.leftPanel.collapsed).toBe(true)
    expect(store.getState().ui.rightPanel.collapsed).toBe(false)

    store.getState().togglePanel('right')
    store.getState().togglePanel('left')

    expect(store.getState().ui.leftPanel.collapsed).toBe(false)
    expect(store.getState().ui.rightPanel.collapsed).toBe(true)
  })

  it('remembers which inspector sections are open', () => {
    const store = createTestStore()

    store.getState().setSectionOpen('layout', true)
    store.getState().setSectionOpen('motion', false)

    expect(store.getState().ui.rightPanel.openSections).toEqual({ layout: true, motion: false })
  })
})

describe('overlays', () => {
  it('opens the palette, the export dialog and a named dialog', () => {
    const store = createTestStore()

    store.getState().setCommandPaletteOpen(true)
    store.getState().setExportDialogOpen(true)
    store.getState().setActiveDialog('shortcuts')
    store.getState().setFpsVisible(true)

    const { ui } = store.getState()

    expect(ui.commandPaletteOpen).toBe(true)
    expect(ui.exportDialogOpen).toBe(true)
    expect(ui.activeDialog).toBe('shortcuts')
    expect(ui.fpsVisible).toBe(true)
  })

  it('closes a dialog by clearing it', () => {
    const store = createTestStore()

    store.getState().setActiveDialog('settings')
    store.getState().setActiveDialog(null)

    expect(store.getState().ui.activeDialog).toBeNull()
  })

  it('is not undoable', () => {
    const store = createTestStore()

    store.getState().setLeftTab('theme')

    expect(store.getState().version).toBe(0)
  })
})
