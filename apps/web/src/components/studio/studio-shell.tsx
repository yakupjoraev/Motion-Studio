'use client'

import { cn } from '@motion-studio/utils'
import { type ReactNode, useEffect, useState } from 'react'

import { type PanelSide, isCollapsed } from '../../hooks/panel-layout'
import { usePanelLayout } from '../../hooks/use-panel-layout'
import { useViewportGuard } from '../../hooks/use-viewport-guard'

import { Inspector } from './inspector/inspector'
import { LeftPanel } from './left-panel/left-panel'
import { PanelResizer } from './panel-resizer'
import { StatusBar } from './status-bar/status-bar'
import { TopBar } from './top-bar/top-bar'

export interface StudioShellProps {
  /** The canvas island, passed in rather than imported: a panel resize must not render it — ADR-049. */
  readonly canvas: ReactNode
}

/** UI_GUIDELINES.md § Focus and keyboard: `F2` cycles canvas → left → inspector → canvas. */
const FOCUS_CYCLE = ['canvas', 'left', 'inspector'] as const

type FocusScope = (typeof FOCUS_CYCLE)[number]

const SCOPE_SELECTOR = '[data-shortcut-scope]'

const focusScope = (scope: FocusScope): void => {
  document.querySelector<HTMLElement>(`[data-shortcut-scope="${scope}"]`)?.focus()
}

/** Focus anywhere inside a region counts as being in it, so `F2` works from a control, not just the frame. */
const nextScope = (): FocusScope => {
  const region = document.activeElement?.closest(SCOPE_SELECTOR) ?? null
  const scope = region?.getAttribute('data-shortcut-scope') ?? null
  const index = FOCUS_CYCLE.indexOf(scope as FocusScope)

  return FOCUS_CYCLE[(index + 1) % FOCUS_CYCLE.length] ?? 'canvas'
}

const REGION_CLASS = 'relative min-w-0 outline-none focus-visible:shadow-focus'

const PANEL_CLASS = 'ms-panel-overlay bg-surface-1'

/**
 * The room the editor goes into: a three-column grid whose track list reads `--ms-panel-left` and
 * `--ms-panel-right`, a top bar, a status bar, and the three focus scopes `F2` walks between.
 *
 * Nothing here knows what a document is. The panels are frames and the canvas is a slot.
 */
export function StudioShell({ canvas }: StudioShellProps) {
  const { layout, setWidth, toggleCollapsed } = usePanelLayout()
  const mode = useViewportGuard()
  /** Overlay openness is session state, not a persisted preference — ADR-050. */
  const [overlayOpen, setOverlayOpen] = useState<PanelSide | null>(null)

  const isOpen = (side: PanelSide): boolean =>
    mode === 'overlay' ? overlayOpen === side : !isCollapsed(layout, side)

  const togglePanel = (side: PanelSide): void => {
    if (mode === 'overlay') {
      setOverlayOpen((current) => (current === side ? null : side))

      return
    }

    toggleCollapsed(side)
  }

  // No dependency array: the handler closes over `mode` and the current layout, and re-subscribing a
  // single keydown listener costs less than the ref indirection that would avoid it.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'F2') {
        event.preventDefault()
        focusScope(nextScope())

        return
      }

      // SHORTCUTS.md § Global. The registry that owns the rest of the map arrives in prompt 33.
      if (event.key !== '\\' || !(event.metaKey || event.ctrlKey)) {
        return
      }

      event.preventDefault()
      togglePanel(event.altKey ? 'right' : 'left')
    }

    window.addEventListener('keydown', onKeyDown)

    return () => window.removeEventListener('keydown', onKeyDown)
  })

  return (
    <>
      {/* Below 1024 px the chrome is present but unusable, so it is also unreachable — ADR-050. */}
      <div className="ms-studio" inert={mode === 'narrow'}>
        <TopBar leftOpen={isOpen('left')} onTogglePanel={togglePanel} rightOpen={isOpen('right')} />

        <aside
          aria-label="Left panel"
          className={cn(REGION_CLASS, PANEL_CLASS, 'border-border border-r')}
          data-open={String(isOpen('left'))}
          data-shortcut-scope="left"
          data-side="left"
          inert={!isOpen('left')}
          tabIndex={-1}
        >
          <div className="h-full overflow-hidden">
            <LeftPanel />
          </div>
          {isOpen('left') ? (
            <PanelResizer
              aria-label="Left panel width"
              onWidthChange={(width) => setWidth('left', width)}
              side="left"
              width={layout.left}
            />
          ) : null}
        </aside>

        <main
          aria-label="Canvas"
          className={cn(REGION_CLASS, 'overflow-hidden')}
          data-shortcut-scope="canvas"
          tabIndex={-1}
        >
          {canvas}
        </main>

        <aside
          aria-label="Inspector"
          className={cn(REGION_CLASS, PANEL_CLASS, 'border-border border-l')}
          data-open={String(isOpen('right'))}
          data-shortcut-scope="inspector"
          data-side="right"
          inert={!isOpen('right')}
          tabIndex={-1}
        >
          <div className="h-full overflow-hidden">
            <Inspector />
          </div>
          {isOpen('right') ? (
            <PanelResizer
              aria-label="Inspector width"
              onWidthChange={(width) => setWidth('right', width)}
              side="right"
              width={layout.right}
            />
          ) : null}
        </aside>

        <StatusBar />
      </div>

      <div className="ms-studio-notice h-dvh place-content-center gap-3 px-6 text-center">
        <p className="text-sm">Motion Studio needs a wider screen.</p>
        <a className="text-accent text-sm underline underline-offset-4" href="/blocks">
          Browse the block gallery instead →
        </a>
      </div>
    </>
  )
}
