'use client'

import { cn } from '@motion-studio/utils'
import dynamic from 'next/dynamic'
import { type ReactNode, useEffect, useState } from 'react'

import { type PanelSide, isCollapsed } from '../../hooks/panel-layout'
import { usePanelLayout } from '../../hooks/use-panel-layout'
import { useViewportGuard } from '../../hooks/use-viewport-guard'

import { Inspector } from './inspector/inspector'
import { LeftPanel } from './left-panel/left-panel'
import { ThemeHost } from './left-panel/theme/theme-host'
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

/**
 * The keyboard map is a chunk of its own, loaded right after hydration rather than with the shell.
 * ADR-152 carries the measurement: the registry, the two overlay entry points and the hooks package
 * are 6 kB of a 250 kB budget, and nothing can be typed at a studio that has not hydrated yet.
 */
const ShortcutHost = dynamic(
  () => import('./shortcuts/shortcut-host').then((module) => module.ShortcutHost),
  { ssr: false },
)

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

  /*
   * `F2` stays here and is declared `delegated` in the registry (ADR-150): cycling the focus scopes
   * needs `document.activeElement` at the moment of the press, which a central `run` cannot see.
   * Everything else the shell used to listen for is in the registry now.
   */
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'F2') {
        return
      }

      event.preventDefault()
      focusScope(nextScope())
    }

    window.addEventListener('keydown', onKeyDown)

    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  /**
   * What the panel bindings call. Built fresh on every render rather than memoised: both closures
   * read the current layout, and a stale one would toggle a panel from a width that has moved. It
   * costs nothing — `useShortcuts` keeps the context in a ref, so the keydown listener does not move
   * when this object does.
   */
  const panels = { toggle: togglePanel, isOpen }

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

      <ShortcutHost panels={panels} />

      {/* Renders nothing: it holds the subscription that puts `document.theme` on the root — ADR-172. */}
      <ThemeHost />

      <div className="ms-studio-notice h-dvh place-content-center gap-3 px-6 text-center">
        <p className="text-sm">Motion Studio needs a wider screen.</p>
        <a className="text-accent text-sm underline underline-offset-4" href="/blocks">
          Browse the block gallery instead →
        </a>
      </div>
    </>
  )
}
