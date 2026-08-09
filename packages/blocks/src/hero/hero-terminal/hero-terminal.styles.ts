import { cva } from 'class-variance-authority'

/**
 * A window, not a card: an inset surface behind the text, a raised surface for the title bar, one
 * hairline between them. That hierarchy is the whole illusion — a flat panel with a monospace font
 * inside reads as a code sample, and the point of this block is that it reads as a machine.
 */
export const HERO_TERMINAL_WINDOW =
  'w-full overflow-hidden rounded-xl border border-border bg-surface-inset shadow-xl'

export const HERO_TERMINAL_BAR =
  'flex items-center gap-3 border-border border-b bg-surface-1 px-4 py-3'

/** Themed, so the lights follow the palette instead of pinning macOS's three colours. */
export const TRAFFIC_LIGHTS = ['bg-danger', 'bg-warning', 'bg-success'] as const

export const TRAFFIC_LIGHT_BASE = 'size-3 rounded-full opacity-80'

export const HERO_TERMINAL_TITLE = 'truncate font-medium text-foreground-subtle text-xs'

export const HERO_TERMINAL_BODY =
  'm-0 overflow-x-auto p-5 font-mono text-foreground text-sm leading-[1.7]'

export const terminalLineStyles = cva('block whitespace-pre', {
  variants: {
    kind: {
      prompt: 'text-foreground',
      output: 'text-foreground-muted',
      error: 'text-danger',
    },
  },
})

/** The sigil belongs to the line kind, not to the text — so the copy stays copyable. */
export const LINE_SIGILS = { prompt: '$ ', output: '  ', error: '! ' } as const

export const HERO_TERMINAL_CARET =
  'ms-terminal-caret inline-block h-4 w-2 translate-y-0.5 bg-accent'

export const heroTerminalSurfaceStyles = cva('overflow-hidden', {
  variants: {
    background: {
      transparent: 'bg-transparent',
      'surface-0': 'bg-surface-0',
      'surface-1': 'bg-surface-1',
      'surface-2': 'bg-surface-2',
    },
  },
})
