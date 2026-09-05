'use client'

import { selectors } from '@motion-studio/editor'
/*
 * The subpath, not the barrel: `@motion-studio/motion` also exports the applier, which is
 * framer-motion, and the status bar reads one media query — ADR-313.
 */
import { useReducedMotion } from '@motion-studio/motion/reduced'
import { BREAKPOINTS } from '@motion-studio/schema'
import { Separator } from '@motion-studio/ui'

import { BACKDROP_CAP, useBackdropCount } from '../../../hooks/use-backdrop-count'
import type { Dictionary } from '../../../lib/i18n/dictionary'
import { useLocale } from '../../../lib/i18n/locale-context'
import type { Locale } from '../../../lib/i18n/locales'
import { formatPlural } from '../../../lib/i18n/plural'
import { useStudio } from '../../../lib/i18n/studio-surface'
import { useStudioStore } from '../../../store/editor-store'

import { FpsMeter } from './fps-meter'

/** "Hero selected", "3 selected", or nothing — the phrasing the canvas announces. */
function describeSelection(
  locale: Locale,
  chrome: Dictionary['studio']['chrome'],
  count: number,
  name: string | null,
): string {
  if (count === 0) {
    return chrome.statusNoSelection
  }

  return count === 1
    ? chrome.statusOneSelected.replace('{name}', name ?? chrome.statusBlockFallback)
    : formatPlural(locale, count, chrome.statusManySelected)
}

/**
 * § Density scale: 28 px. Everything on it is read from the store, so it reports the document rather
 * than a guess — the node count, the selection, the breakpoint being previewed, and whether motion
 * is frozen (`Mod+P`, ADR-100).
 */
export function StatusBar() {
  const { chrome } = useStudio()
  const { locale } = useLocale()
  const reduced = useReducedMotion()
  const nodeCount = useStudioStore((state) => Object.keys(state.document.nodes).length)
  // Two primitive selectors rather than one joined string: a block's name may contain a space, and
  // a subscription that returned a new array every time would re-render on every store write.
  const selectedCount = useStudioStore((state) => state.selection.ids.length)
  const selectedName = useStudioStore((state) => {
    const [id] = state.selection.ids

    return id === undefined ? null : (state.document.nodes[id]?.name ?? null)
  })
  const breakpoint = useStudioStore((state) => state.viewport.breakpoint)
  const motionPaused = useStudioStore((state) => state.viewport.motionPaused)
  const dirty = useStudioStore(selectors.selectDirty)
  // The toggle is store state, not local state: it is a preference the session keeps, and the
  // command palette can reach it — STATE_MANAGEMENT.md § ui.
  const showFps = useStudioStore((state) => state.ui.fpsVisible)
  const setFpsVisible = useStudioStore((state) => state.setFpsVisible)
  const glass = useBackdropCount()

  return (
    <footer className="col-span-3 flex h-[28px] items-center gap-2 border-border border-t bg-surface-1 px-3 text-2xs text-foreground-muted">
      <span data-testid="status-nodes">{formatPlural(locale, nodeCount, chrome.statusNodes)}</span>
      <Separator className="h-3" decorative orientation="vertical" />
      <span data-testid="status-selection">
        {describeSelection(locale, chrome, selectedCount, selectedName)}
      </span>
      <Separator className="h-3" decorative orientation="vertical" />
      <span data-testid="status-breakpoint">{BREAKPOINTS[breakpoint].label}</span>
      <Separator className="h-3" decorative orientation="vertical" />
      <button
        aria-label={chrome.statusFrameRate}
        aria-pressed={showFps}
        className="ms-transition-control rounded-xs px-1 outline-none hover:text-foreground focus-visible:shadow-focus"
        onClick={() => setFpsVisible(!showFps)}
        type="button"
      >
        {showFps ? <FpsMeter /> : chrome.statusFps}
      </button>
      <div className="flex-1" />
      {glass > BACKDROP_CAP && (
        <>
          {/*
           * DESIGN_SYSTEM.md § Glass, rule 2: four at once. The canvas counts what it is actually
           * compositing — a computed `backdrop-filter`, whoever wrote it — and says so here rather
           * than leaving a user to wonder why a section became expensive.
           */}
          <output className="text-warning" data-testid="status-backdrop">
            {chrome.statusGlassOverCap
              .replace('{count}', String(glass))
              .replace('{cap}', String(BACKDROP_CAP))}
          </output>
          <Separator className="h-3" decorative orientation="vertical" />
        </>
      )}
      {motionPaused && (
        <>
          <span className="text-warning" data-testid="status-motion">
            {chrome.statusMotionPaused}
          </span>
          <Separator className="h-3" decorative orientation="vertical" />
        </>
      )}
      <span data-testid="status-saved">{dirty ? chrome.statusUnsaved : chrome.statusSaved}</span>
      <Separator className="h-3" decorative orientation="vertical" />
      <span>
        {chrome.statusReducedMotion} {reduced ? chrome.statusOn : chrome.statusOff}
      </span>
    </footer>
  )
}
