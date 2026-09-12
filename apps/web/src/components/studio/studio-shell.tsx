'use client'

import { ToastProvider, watchFocusReturn } from '@motion-studio/ui'
import { cn } from '@motion-studio/utils'
import dynamic from 'next/dynamic'
import { type ReactNode, useEffect, useState } from 'react'

import { RenderCounter } from '../../lib/dev/render-counter'
import { watchGestures } from '../../lib/errors/watch-gestures'
import { useLocale } from '../../lib/i18n/locale-context'
import { useStudio } from '../../lib/i18n/studio-surface'
import { useStudioStore } from '../../store/editor-store'
import { CommandAnnouncer } from './command-announcer'

import { type PanelSide, isCollapsed } from '../../hooks/panel-layout'
import { usePanelLayout } from '../../hooks/use-panel-layout'
import { usePersistedCodePanel } from '../../hooks/use-persisted-code-panel'
import { useViewportGuard } from '../../hooks/use-viewport-guard'

import { DndHost } from './dnd-host'
import { DocumentsProvider } from './documents/documents-context'
import { DocumentsHost } from './documents/documents-host'
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

/**
 * UI_GUIDELINES.md § Focus and keyboard: `F2` cycles canvas → left → code → inspector → canvas.
 *
 * `code` sits between the canvas and the inspector because that is where it is on screen, and it is
 * in the cycle **only while it is mounted** — a closed panel that still took a turn would be a press
 * that moves focus nowhere, which is indistinguishable from a broken key (ADR-401).
 */
const FOCUS_CYCLE = ['canvas', 'left', 'code', 'inspector'] as const

type FocusScope = (typeof FOCUS_CYCLE)[number]

const SCOPE_SELECTOR = '[data-shortcut-scope]'

const regionOf = (scope: FocusScope): HTMLElement | null =>
  document.querySelector<HTMLElement>(`[data-shortcut-scope="${scope}"]`)

const focusScope = (scope: FocusScope): void => {
  regionOf(scope)?.focus()
}

/** Focus anywhere inside a region counts as being in it, so `F2` works from a control, not just the frame. */
const nextScope = (): FocusScope => {
  const region = document.activeElement?.closest(SCOPE_SELECTOR) ?? null
  const scope = region?.getAttribute('data-shortcut-scope') ?? null
  const present = FOCUS_CYCLE.filter((one) => regionOf(one) !== null)
  const cycle = present.length === 0 ? FOCUS_CYCLE : present
  const index = cycle.indexOf(scope as FocusScope)

  return cycle[(index + 1) % cycle.length] ?? 'canvas'
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

/**
 * Mounted from the first time it opens and never unmounted after — ADR-313.
 *
 * "Mounted always" was there for two things: a reopen shows the previous run rather than regenerating
 * it, and the surface is visible in the frame the button is pressed. Both survive. What does not
 * survive is 11 kB of Radix dialog machinery in the first load of a studio whose dialog is closed:
 * `react-remove-scroll` and the dismissable layer are 8.9 kB of it, and the chunk is fetched on idle
 * long before anyone presses Export.
 */
const ExportDialog = dynamic(
  () => import('./export/export-dialog').then((module) => module.ExportDialog),
  { ssr: false },
)

/**
 * The printers, Prettier and the tokeniser are the heaviest modules in the app and `PERFORMANCE.md`
 * § Studio keeps them out of the first load. The panel is behind its own chunk and — unlike the
 * export dialog — it is **not** prefetched on idle: a studio whose panel has never been opened must
 * not have paid for it, and the owner's condition is that most sessions never open it (ADR-401).
 */
const CodePanel = dynamic(
  () => import('./code-panel/code-panel').then((module) => module.CodePanel),
  {
    ssr: false,
  },
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
  const { chrome } = useStudio()
  const { href } = useLocale()
  const { layout, setWidth, toggleCollapsed } = usePanelLayout()
  const exportOpen = useStudioStore((state) => state.ui.exportDialogOpen)
  const codePanelOpen = useStudioStore((state) => state.ui.codePanelOpen)
  const [exportMounted, setExportMounted] = useState(false)

  useEffect(() => {
    if (exportOpen) {
      setExportMounted(true)
    }
  }, [exportOpen])

  /*
   * Focus tracking starts with the studio, not with the first dialog — ADR-339.
   *
   * Every studio dialog is lazy (ADR-313), so the listener a dialog installs itself is installed
   * after the control that opened it was focused. Where the menu hands focus back to its trigger
   * before the dialog mounts, `Dialog` reads the trigger off `document.activeElement` and the late
   * listener costs nothing; where the two race the other way — WebKit on the two heaviest dialogs —
   * `activeElement` is `body` by then and there is no record of what to return to.
   */
  useEffect(() => {
    watchFocusReturn()
  }, [])

  /** What the user did last, for a crash report — `prompts/58` § Error report. */
  useEffect(() => watchGestures(), [])

  /* Here rather than in the panel: the flag has to be restored before the panel mounts, and the
     panel only mounts once the flag is true. */
  usePersistedCodePanel()

  /** In memory before the button is pressed, which is what keeps the dialog instant. */
  useEffect(() => {
    if (typeof requestIdleCallback !== 'function') {
      void import('./export/export-dialog')

      return
    }

    const handle = requestIdleCallback(() => void import('./export/export-dialog'), {
      timeout: 2000,
    })

    return () => cancelIdleCallback(handle)
  }, [])
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
    <ToastProvider>
      {/* PERFORMANCE.md § Studio: the chrome's half of "zero React re-renders" is counted here. */}
      <RenderCounter id="studio-shell" />
      {/* ACCESSIBILITY.md § Canvas: what a command did, in words — ADR-326. */}
      <CommandAnnouncer />
      {/* The File menu and the five document dialogs share one set of actions, and the top bar is
          inside the provider because it is the surface that starts most of them. */}
      <DocumentsProvider>
        {/* ADR-179: one drag context over the palette, the canvas and the layers tree. */}
        <DndHost>
          {/* Below 1024 px the chrome is present but unusable, so it is also unreachable — ADR-050. */}
          <div className="ms-studio" inert={mode === 'narrow'}>
            <TopBar
              leftOpen={isOpen('left')}
              onTogglePanel={togglePanel}
              rightOpen={isOpen('right')}
            />

            <aside
              aria-label={chrome.leftPanel}
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
                  aria-label={chrome.leftPanelWidth}
                  onWidthChange={(width) => setWidth('left', width)}
                  side="left"
                  width={layout.left}
                />
              ) : null}
            </aside>

            {/* The middle track, split between the canvas and the code. A wrapper rather than a
                fourth grid column: the track list is the panel layout's contract (`--ms-panel-left`,
                `--ms-panel-right`) and the code panel is not resizable, so it has no width to put
                there. */}
            <div className="flex min-w-0 overflow-hidden">
              <main
                aria-label={chrome.canvas}
                className={cn(REGION_CLASS, 'flex-1 overflow-hidden')}
                data-shortcut-scope="canvas"
                tabIndex={-1}
              >
                {canvas}
              </main>

              {codePanelOpen ? (
                <aside
                  aria-label={chrome.codePanel}
                  className={cn(
                    REGION_CLASS,
                    PANEL_CLASS,
                    'flex w-[var(--ms-code-panel-width)] shrink-0 flex-col border-border border-l',
                  )}
                  data-shortcut-scope="code"
                  data-testid="code-panel-region"
                  tabIndex={-1}
                >
                  <CodePanel />
                </aside>
              ) : null}
            </div>

            <aside
              aria-label={chrome.inspector}
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
                  aria-label={chrome.inspectorWidth}
                  onWidthChange={(width) => setWidth('right', width)}
                  side="right"
                  width={layout.right}
                />
              ) : null}
            </aside>

            <StatusBar />
          </div>

          {/* Inside the drag context on purpose: while a drag is in flight it owns the keyboard, and
              the map has to be able to see that — ADR-381. */}
          <ShortcutHost panels={panels} />
        </DndHost>

        {/* Open on a flag, mounted from the first open onwards, its chunk prefetched on idle. */}
        {exportMounted ? <ExportDialog /> : null}

        {/* Renders nothing itself: autosave, the session restore and the import intake, plus the five
          dialogs each behind its own flag. */}
        <DocumentsHost />

        {/* Renders nothing: it holds the subscription that puts `document.theme` on the root — ADR-172. */}
        <ThemeHost />

        <div className="ms-studio-notice h-dvh place-content-center gap-3 px-6 text-center">
          <p className="text-sm">{chrome.tooNarrow}</p>
          <a className="text-accent text-sm underline underline-offset-4" href={href('/blocks')}>
            {chrome.browseGallery}
          </a>
        </div>
      </DocumentsProvider>
    </ToastProvider>
  )
}
