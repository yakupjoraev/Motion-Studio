import { ControlIcon } from '../../interactive/control-icon'

import type { TimelineMarkerKind, TimelineOrientation } from './timeline.schema'
import { MARKER, MARKER_DOT, markerRailStyles, railStyles } from './timeline.styles'

export interface TimelineMarkerProps {
  readonly kind: TimelineMarkerKind
  readonly icon: string
  readonly step: number
  readonly orientation: TimelineOrientation
  /** The last step has no rail after it: a line running past the end marks a step that is not there. */
  readonly last: boolean
}

/**
 * The marker and the rail after it.
 *
 * The glyph goes through `interactive`'s `ControlIcon`, which looks the name up in the registry and never
 * resolves it as a module path (FILE_FORMAT.md § Security) — the same lookup this block would otherwise have
 * transcribed, and it is already `aria-hidden`, which is right here for the same reason: the step is named by
 * its title.
 *
 * The number is `aria-hidden` too. The list is an `<ol>`, so the position is already in the structure and a
 * screen reader announcing "1" beside "item 1 of 4" is telling the reader nothing twice.
 */
export function TimelineMarker({ kind, icon, step, orientation, last }: TimelineMarkerProps) {
  return (
    <div className={markerRailStyles({ orientation })} data-testid="timeline-marker">
      <span aria-hidden="true" className={MARKER}>
        {kind === 'dot' && <span className={MARKER_DOT} />}
        {kind === 'number' && step}
        {kind === 'icon' && <ControlIcon name={icon} size={14} />}
      </span>

      {!last && <span aria-hidden="true" className={railStyles({ orientation })} />}
    </div>
  )
}
