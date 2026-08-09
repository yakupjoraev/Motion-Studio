import type { RichTextRun as Run } from '@motion-studio/schema'
import type { ReactNode } from 'react'

import { RICH_TEXT_CODE } from './rich-text.styles'

export interface RichTextRunProps {
  readonly run: Run
}

/**
 * One run of text with its marks. They nest outward in a fixed order, so the same value always
 * produces the same tree — which is what lets React keep the DOM stable across an edit.
 */
export function RichTextRun({ run }: RichTextRunProps) {
  let node: ReactNode = run.text

  if (run.marks.includes('code')) {
    node = <code className={RICH_TEXT_CODE}>{node}</code>
  }

  if (run.marks.includes('em')) {
    node = <em>{node}</em>
  }

  if (run.marks.includes('strong')) {
    node = <strong>{node}</strong>
  }

  return <>{node}</>
}
