'use client'

export interface ThemeTabBadgeProps {
  readonly count: number
}

/**
 * The contrast count on the Theme tab, so it is visible from the other four — prompt 36's "the warning
 * count appears on the Theme tab label". It rides in the tab's `icon` slot because `TabItem.label` is
 * also the tab's accessible name, and a name that changes as the palette moves is a name a screen
 * reader announces on every step of a hue drag.
 */
export function ThemeTabBadge({ count }: ThemeTabBadgeProps) {
  return (
    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-warning/15 px-1 font-medium text-[10px] text-warning">
      {count}
      <span className="sr-only">{count === 1 ? ' contrast notice' : ' contrast notices'}</span>
    </span>
  )
}
