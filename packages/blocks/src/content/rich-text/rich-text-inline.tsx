import type { RichTextInline as Inline } from '@motion-studio/schema'

import { RichTextRun } from './rich-text-run'
import { RICH_TEXT_LINK } from './rich-text.styles'

export interface RichTextInlineProps {
  readonly nodes: readonly Inline[]
}

/**
 * The inline level: runs and links. There are exactly two shapes, and this is the only place that
 * knows it.
 *
 * **Position is the identity here, and that is not a shortcut.** The AST carries no ids, and an edit
 * replaces the whole tree rather than mutating a node inside it — so the third run of a paragraph *is*
 * what it is by being third. A key derived from the text would collide the moment a sentence used the
 * same word twice.
 */
export function RichTextInline({ nodes }: RichTextInlineProps) {
  return (
    <>
      {nodes.map((node, position) => {
        if (node.kind === 'link') {
          return (
            <a
              className={RICH_TEXT_LINK}
              href={node.link.href}
              // biome-ignore lint/suspicious/noArrayIndexKey: the tree has no ids and is replaced wholesale, so position is the only identity a node has
              key={position}
            >
              {node.link.runs.map((run, runPosition) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: same reason, one level down
                <RichTextRun key={runPosition} run={run} />
              ))}
            </a>
          )
        }

        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: same reason
          <RichTextRun key={position} run={node.run} />
        )
      })}
    </>
  )
}
