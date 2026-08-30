'use client'

import type { BlockCategory, BlockId, UnknownProps } from '@motion-studio/schema'
import { type ReactNode, useCallback, useState } from 'react'

import { useBlockState } from '../use-block-state'

import { BlockControls } from './block-controls'
import { BlockPreview } from './block-preview'
import type { PrintedSource } from './block-source'
import { CopyButton } from './copy-button'
import { RejectedNotice } from './rejected-notice'
import { SourcePanel } from './source-panel'
import { type PreviewTheme, ThemeSwitcher } from './theme-switcher'
import { useSource } from './use-source'
import { type PreviewWidth, ViewportSwitcher } from './viewport-switcher'

export interface BlockWorkbenchProps {
  readonly id: BlockId
  readonly category: BlockCategory
  readonly name: string
  readonly defaults: UnknownProps
  /** Printed on the server for the defaults, so the first screenful needs no exporter. */
  readonly sourceOfDefaults: PrintedSource
  /** What a slot-bearing block arranges, sent down from the server — `slotFill`. */
  readonly children?: ReactNode
}

/**
 * Flow A, on one screen — PRODUCT.md § User flows: "a developer arrives, finds an effect, tunes it,
 * copies the code, and leaves in under 60 seconds."
 *
 * The layout is the constraint doing the work. Preview and controls are side by side above the fold
 * on a desktop and stacked in that order on a phone, so the thing being changed and the thing that
 * changes it are never a scroll apart. The Copy button is in the first screenful because the visitor
 * who already knows what they want should not have to look for it.
 */
export function BlockWorkbench({
  id,
  category,
  name,
  defaults,
  sourceOfDefaults,
  children,
}: BlockWorkbenchProps) {
  const state = useBlockState(id, category, defaults)
  const source = useSource(id, state.props, sourceOfDefaults, state.modified)
  const [width, setWidth] = useState<PreviewWidth>('xl')
  const [theme, setTheme] = useState<PreviewTheme>('studio-dark')
  const [announcement, setAnnouncement] = useState('')

  const change = useCallback(
    (path: string, value: unknown) => {
      state.change(path, value)
      setAnnouncement(`${path} ${format(value)}`)
    },
    [state],
  )

  return (
    <div className="flex flex-col gap-10">
      {/*
        `min-w-0` on both columns. A grid track defaults to `auto`, which resolves to max-content, so
        a column holding a 1280 px preview stage claims 1280 px of width however the stage is clipped
        — measured at 320 px as a page 600 px wide that scrolls sideways.
      */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <div className="flex min-w-0 flex-col gap-3">
          {/*
            Its own stacking context, above the preview, with an opaque background.
            `aurora-background` draws its fields 20 % beyond its own stage and the frame clips them —
            but a bounding rect knows nothing about clipping, so a contrast scanner reads a
            translucent purple field as sitting *over* this row and reports 3.43:1 for text that is
            over `surface-0` at about 8:1 in every pixel a person sees. Ordering the toolbar above the
            preview is true of what is painted and is what makes the two agree.
          */}
          <div className="relative z-10 flex flex-wrap items-center gap-2 bg-surface-0">
            <ViewportSwitcher onChange={setWidth} value={width} />
            <ThemeSwitcher onChange={setTheme} value={theme} />
            {/* `prompts/52` § Sixty seconds: the copy button is in the first screenful, not below
                the listing it copies. */}
            <span className="sm:ml-auto">
              <CopyButton label="Copy React" text={source.source.contents} />
            </span>
          </div>

          <BlockPreview
            category={category}
            id={id}
            name={name}
            props={state.props}
            theme={theme}
            width={width}
          >
            {children}
          </BlockPreview>

          {/*
            ACCESSIBILITY.md § Live regions: a control that changes something only visible has to say
            what it changed. It reads the value, not "updated" — the value is the thing the visitor
            is choosing.
          */}
          <span aria-live="polite" className="sr-only" data-testid="preview-announcer">
            {announcement}
          </span>
        </div>

        <aside className="flex min-w-0 flex-col rounded-xl border border-border bg-surface-1">
          <header className="flex items-center justify-between gap-3 border-border-subtle border-b px-3 py-2.5">
            <h2 className="font-mono text-2xs uppercase tracking-[0.14em]">{name} · props</h2>
            <button
              className="rounded-sm px-1.5 py-0.5 font-mono text-2xs text-foreground-muted uppercase tracking-[0.12em] outline-none transition-colors hover:text-foreground focus-visible:shadow-focus disabled:opacity-40"
              disabled={!state.modified}
              onClick={state.reset}
              type="button"
            >
              Reset
            </button>
          </header>

          <RejectedNotice paths={state.rejected} />

          <BlockControls
            definition={state.definition}
            onChange={change}
            onCommit={state.commit}
            props={state.props}
          />
        </aside>
      </div>

      <SourcePanel state={source} />
    </div>
  )
}

const format = (value: unknown): string =>
  typeof value === 'string' ? value : JSON.stringify(value)
