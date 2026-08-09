import { z } from 'zod'

import { visibility } from '../../scales'

import { LANGUAGES } from './code-block.languages'

export const CODE_MAX_LENGTH = 20_000
export const FILENAME_MAX_LENGTH = 120

export const codeBlockSchema = z.object({
  code: z
    .string()
    .max(CODE_MAX_LENGTH)
    .default(
      [
        "import { HeroAurora } from '@/components/hero-aurora'",
        '',
        'export default function Page() {',
        '  return <HeroAurora headline="Build the thing you keep sketching" />',
        '}',
      ].join('\n'),
    ),
  language: z.enum(LANGUAGES).default('tsx'),
  filename: z.string().max(FILENAME_MAX_LENGTH).default('app/page.tsx'),
  showLineNumbers: z.boolean().default(true),
  /** A range string: `2-4,7`. Anything unparseable highlights nothing rather than throwing. */
  highlightLines: z.string().max(120).default(''),
  showCopyButton: z.boolean().default(true),
  wrap: z.boolean().default(false),
  hidden: visibility,
})

export type CodeBlockProps = z.infer<typeof codeBlockSchema>
