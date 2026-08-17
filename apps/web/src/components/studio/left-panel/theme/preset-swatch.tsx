'use client'

/**
 * A preset seen rather than named: the accent ramp, the surfaces, and a card small enough to fit a
 * 320 px panel but complete enough to show what the preset does to radius, elevation and type.
 *
 * Every colour here is an inline `var(--ms-*)`, never a token class. The Tailwind bridge resolves
 * `--color-surface-1: var(--ms-color-surface-1)` on `:root`, so a class inside a `ThemeScope` would
 * read the root's theme and every preview would look identical — measured in prompt 25, and the reason
 * the gallery's previews are written this way too.
 *
 * All spans: the swatch renders inside the picker's button, which may hold phrasing content only.
 */

const RAMP = ['accent-muted', 'accent-ring', 'accent', 'accent-hover', 'accent-active'] as const

function AccentRamp() {
  return (
    <span className="flex h-1.5 w-full overflow-hidden rounded-full">
      {RAMP.map((token) => (
        <span
          className="h-full flex-1"
          key={token}
          style={{ background: `var(--ms-color-${token})` }}
        />
      ))}
    </span>
  )
}

/** The miniature: a surface, two lines of type and a filled button, at the preset's own radius. */
function MiniatureCard() {
  return (
    <span
      className="flex flex-col gap-1.5 p-2"
      style={{
        background: 'var(--ms-color-surface-2)',
        border: '1px solid var(--ms-color-border)',
        borderRadius: 'var(--ms-radius-md)',
        boxShadow: 'var(--ms-shadow-sm)',
      }}
    >
      <span
        className="h-1.5 w-2/3 rounded-full"
        style={{ background: 'var(--ms-color-foreground)' }}
      />
      <span
        className="h-1 w-full rounded-full"
        style={{ background: 'var(--ms-color-foreground-muted)' }}
      />
      <span
        className="mt-0.5 h-3 w-10"
        style={{ background: 'var(--ms-color-accent)', borderRadius: 'var(--ms-radius-sm)' }}
      />
    </span>
  )
}

/** Decorative: the preset's name is the button's accessible name, and this repeats nothing. */
export function PresetSwatch() {
  return (
    <span
      aria-hidden="true"
      className="flex flex-col gap-1.5 p-1.5"
      style={{ background: 'var(--ms-color-surface-1)', borderRadius: 'var(--ms-radius-sm)' }}
    >
      <AccentRamp />
      <MiniatureCard />
    </span>
  )
}
