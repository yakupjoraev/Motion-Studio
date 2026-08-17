'use client'

import { WarningIcon } from '@motion-studio/icons'
import type { ThemeResolution } from '@motion-studio/theme'
import { useEffect, useState } from 'react'

import { contrastNoticeCount } from './contrast-count'
import { ContrastRepairItem } from './contrast-repair-item'
import { useThemeEdit } from './use-theme-edit'

/** 500 ms, the same debounce the playground's diagnostics use — `ACCESSIBILITY.md` § Playground. */
const ANNOUNCE_DELAY_MS = 500

const summarise = (resolution: ThemeResolution): string => {
  const total = contrastNoticeCount(resolution)

  if (total === 0) {
    return 'Contrast passes.'
  }

  const repaired = resolution.repairs.length
  const kept = resolution.overrides.length
  const unfixable = resolution.warnings.length
  const parts = [
    repaired === 0 ? '' : `${repaired} contrast repair${repaired === 1 ? '' : 's'}`,
    kept === 0 ? '' : `${kept} kept at your request`,
    unfixable === 0 ? '' : `${unfixable} pair${unfixable === 1 ? '' : 's'} no step can fix`,
  ]

  return `${parts.filter((part) => part !== '').join(', ')}.`
}

export interface ContrastReportProps {
  readonly resolution: ThemeResolution
}

/**
 * The repairs, surfaced rather than hidden — `THEME_ENGINE.md` § Contrast repair. Both halves are
 * structural: a failing pair is never silent, and the author's override is never silent either.
 *
 * The summary is a `role="status"` live region, debounced so that dragging the hue slider does not
 * narrate every intermediate ratio — `ACCESSIBILITY.md` § Contrast.
 */
export function ContrastReport({ resolution }: ContrastReportProps) {
  const { set } = useThemeEdit()
  const summary = summarise(resolution)
  const [announced, setAnnounced] = useState(summary)

  useEffect(() => {
    const timer = setTimeout(() => setAnnounced(summary), ANNOUNCE_DELAY_MS)

    return () => clearTimeout(timer)
  }, [summary])

  const notices = [...resolution.repairs, ...resolution.overrides]

  return (
    <section aria-label="Contrast" className="flex flex-col gap-2">
      {/* An `output` rather than a `div` with `role="status"`: same implicit role, one element. */}
      <output className="sr-only">{announced}</output>

      {notices.length === 0 && resolution.warnings.length === 0 ? (
        <p className="px-1 text-[11px] text-foreground-subtle">Contrast passes in this mode.</p>
      ) : (
        <p className="flex items-center gap-1.5 px-1 font-medium text-[11px] text-warning">
          <WarningIcon aria-hidden="true" size={12} />
          {summary}
        </p>
      )}

      {notices.length === 0 ? null : (
        <ul className="flex flex-col gap-2 rounded-md border border-border p-2">
          {notices.map((repair) => (
            <ContrastRepairItem
              kept={resolution.overrides.includes(repair)}
              key={`${repair.token}-${repair.against}`}
              onKeepMine={() => set('palette.repairContrast', false)}
              onRepair={() => set('palette.repairContrast', true)}
              repair={repair}
            />
          ))}
        </ul>
      )}

      {resolution.warnings.map((warning) => (
        <p className="px-1 text-[11px] text-foreground-muted leading-snug" key={warning}>
          {warning}
        </p>
      ))}
    </section>
  )
}
