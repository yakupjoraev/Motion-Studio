import type { CssFeature } from '@motion-studio/schema/css'
import type { ReactElement } from 'react'

/**
 * Layer 4's answer — PLAYGROUND.md § Parsing and validation. The playground is a place to learn what a
 * property does, and "which browsers have this" is half of what a reader needs before they use it.
 *
 * It is a list rather than a sentence because it grows: `color-mix(in oklab, oklch(…), …)` is two
 * notes, and two notes read as two rows.
 */
export function CompatNotes({
  features,
}: {
  readonly features: readonly CssFeature[]
}): ReactElement | null {
  if (features.length === 0) {
    return null
  }

  return (
    <ul
      aria-label="Compatibility"
      className="m-0 flex list-none flex-wrap gap-x-4 gap-y-1 p-0 text-foreground-muted text-xs"
    >
      {features.map((feature) => (
        <li key={feature.id}>
          <code className="font-mono text-foreground">{feature.label}</code> — {feature.support}
        </li>
      ))}
    </ul>
  )
}
