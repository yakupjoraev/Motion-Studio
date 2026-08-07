import { cva } from 'class-variance-authority'

/** A cap, not a button: nothing here should look pressable. `tabular-nums` keeps a column of hints steady. */
export const kbdStyles = cva([
  'inline-flex min-w-[16px] items-center justify-center rounded-xs border border-border px-1',
  'bg-surface-2 font-medium font-sans text-2xs text-foreground-muted tabular-nums',
])
