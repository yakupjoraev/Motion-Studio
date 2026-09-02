import { expect, test } from '@playwright/test'

import { StudioPage } from '../fixtures/studio-page'

/** The grid in `responsive-grid`, which is the node the whole spec edits. */
const GRID = 'node_f002'

/**
 * RESPONSIVE_ENGINE.md § Testing, as a flow: the cascade is what a user sees, and the mistake it
 * exists to prevent — an override that looks right in the editor and wrong in the browser — only
 * shows up when the same value is read at more than one breakpoint.
 */
test.describe('editing across breakpoints', () => {
  let studio: StudioPage

  test.beforeEach(async ({ page }) => {
    studio = new StudioPage(page)

    await studio.open('responsive-grid')
    await studio.canvas.select(GRID)
    await studio.inspector.ready()
  })

  const expectColumns = async (value: number): Promise<void> => {
    await expect.poll(() => studio.inspector.readControl('Columns')).toBe(String(value))
  }

  test('inherits the base value upwards, and marks nothing while it is the base value', async () => {
    await studio.inspector.setControl('Columns', '1')
    await studio.inspector.setBreakpoint('md')

    await expectColumns(1)
    // RESPONSIVE_ENGINE.md § Editing semantics: the muted dot is for a value inherited from a
    // *smaller breakpoint*; the base value is the one state that carries no marker at all.
    await expect(studio.inspector.overrideMarker()).toHaveCount(0)
    await expect(studio.inspector.responsiveHeader()).toContainText('Editing md and up')
  })

  test('writes an override at md and leaves base alone', async () => {
    await studio.inspector.setControl('Columns', '1')
    await studio.inspector.setBreakpoint('md')
    await studio.inspector.setControl('Columns', '4')

    await expect(studio.inspector.overrideMarker()).toHaveAttribute('data-override', 'overridden')
    await expect(await studio.inspector.control('Columns')).toHaveAccessibleDescription(
      'Overridden at md',
    )

    await studio.inspector.setBreakpoint('lg')

    // Above the override, the same value arrives by cascade and says where it came from.
    await expectColumns(4)
    await expect(studio.inspector.overrideMarker()).toHaveAttribute('data-override', 'inherited')
    await expect(await studio.inspector.control('Columns')).toHaveAccessibleDescription(
      'Inherited from md',
    )

    await studio.inspector.setBreakpoint('base')

    await expectColumns(1)
    await expect(studio.inspector.overrideMarker()).toHaveCount(0)
  })

  test('removes the override key on reset rather than writing the inherited value back', async () => {
    await studio.inspector.setControl('Columns', '1')
    await studio.inspector.setBreakpoint('md')
    await studio.inspector.setControl('Columns', '4')

    await studio.inspector.resetControl('Columns')

    // A key set to the base value would still be an override, and would still draw the accent dot —
    // and would emit a dead Tailwind class on export. Its absence is what this asserts.
    await expectColumns(1)
    await expect(studio.inspector.overrideMarker()).toHaveCount(0)
  })

  test('previews each breakpoint at its own frame width', async () => {
    await expect(studio.canvas.artboard()).toHaveCSS('width', '375px')

    await studio.inspector.setBreakpoint('lg')

    await expect(studio.canvas.artboard()).toHaveCSS('width', '1024px')
    await expect(studio.canvas.breakpointLabel()).toHaveText('lg · 1024')
  })

  test('compares base, md and xl side by side, read-only', async () => {
    await studio.canvas.toggleMultiFrame()

    await expect(studio.canvas.multiFrame()).toBeVisible()

    for (const frame of ['base', 'md', 'xl']) {
      await expect(studio.canvas.frame(frame)).toBeVisible()
    }

    // Editing happens in the active frame only, and the caption is what says which one that is.
    await expect(studio.canvas.frame('base')).toContainText('editing')
    await expect(studio.canvas.root()).toHaveCount(0)

    await studio.canvas.toggleMultiFrame()

    await expect(studio.canvas.root()).toBeVisible()
  })
})
