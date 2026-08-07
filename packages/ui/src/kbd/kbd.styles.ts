import { cva } from 'class-variance-authority'

/**
 * A key cap, not a button: no hover, no press, no focus ring. It is a label for a key that lives on the
 * user's keyboard, and making it look pressable would promise something it does not do.
 *
 * `text-2xs` is one step below the chrome's `text-xs` — a shortcut hint is secondary to whatever names it,
 * and `DESIGN_SYSTEM.md` § Typography puts `2xs` there. `tabular-nums` keeps `⌘1`…`⌘9` the same width so a
 * column of hints in a menu does not ripple.
 */
export const kbdStyles = cva([
  'inline-flex min-w-[16px] items-center justify-center rounded-xs border border-border px-1',
  'bg-surface-2 font-medium font-sans text-2xs text-foreground-muted tabular-nums',
])
