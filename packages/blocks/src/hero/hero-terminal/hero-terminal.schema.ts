import { z } from 'zod'

import { surfaceToken } from '../../scales'
import { heroCopyFields, heroFrameFields } from '../hero.schema'

export const LINE_KINDS = ['prompt', 'output', 'error'] as const

export type TerminalLineKind = (typeof LINE_KINDS)[number]

export const WINDOW_CHROME = ['both', 'lights', 'title'] as const

export type WindowChrome = (typeof WINDOW_CHROME)[number]

export const LINE_MAX_LENGTH = 120
export const MAX_LINES = 12

export const terminalLineSchema = z.object({
  text: z.string().max(LINE_MAX_LENGTH).default(''),
  kind: z.enum(LINE_KINDS).default('output'),
})

export type TerminalLine = z.infer<typeof terminalLineSchema>

export const heroTerminalSchema = z.object({
  ...heroCopyFields({
    eyebrow: 'For engineers',
    headline: 'It ends in a pull request, not a screenshot',
    subtitle:
      'Export straight into the repository you already have — one command, and a diff your team can review.',
    actions: [
      { label: 'Install the CLI', href: '#', variant: 'primary' },
      { label: 'Read the export docs', href: '#', variant: 'secondary' },
    ],
  }),
  ...heroFrameFields({ align: 'start', minHeight: 'three-quarters' }),
  background: surfaceToken.default('transparent'),
  title: z.string().max(48).default('motion-studio — export'),
  chrome: z.enum(WINDOW_CHROME).default('both'),
  /** The caret sits after the last line. It blinks; it is the only thing in the window that moves. */
  caret: z.boolean().default(true),
  lines: z
    .array(terminalLineSchema)
    .max(MAX_LINES)
    .default([
      { text: 'npx motion-studio export --target next', kind: 'prompt' },
      { text: 'Reading document … 24 nodes, 3 breakpoints', kind: 'output' },
      { text: 'Wrote 12 components · 4 routes · 1 theme', kind: 'output' },
      { text: 'tsc --noEmit … 0 errors', kind: 'output' },
      { text: 'Done in 1.8s', kind: 'output' },
    ]),
})

export type HeroTerminalProps = z.infer<typeof heroTerminalSchema>
