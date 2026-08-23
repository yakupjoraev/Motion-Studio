import type {
  RichTextBlock as Block,
  RichTextInline as Inline,
  MarkupChild,
  MarkupElement,
  RichTextRun as Run,
} from '@motion-studio/schema'
import { defineMarkup, el, literal, txt } from '@motion-studio/schema'

import {
  RICH_TEXT_CODE,
  RICH_TEXT_LINK,
  RICH_TEXT_ORDERED,
  RICH_TEXT_PARAGRAPH,
  RICH_TEXT_UNORDERED,
  richTextStyles,
} from './rich-text.styles'
import type { RichTextProps } from './rich-text.types'

/** Marks nest outward in a fixed order, so the same run always produces the same tree. */
function runMarkup(run: Run): MarkupChild {
  let node: MarkupChild = txt(run.text)

  if (run.marks.includes('code')) {
    node = el('code', { classNames: [RICH_TEXT_CODE], children: [node] })
  }

  if (run.marks.includes('em')) {
    node = el('em', { children: [node] })
  }

  if (run.marks.includes('strong')) {
    node = el('strong', { children: [node] })
  }

  return node
}

const inlineMarkup = (nodes: readonly Inline[]): readonly MarkupChild[] =>
  nodes.map((node) =>
    node.kind === 'link'
      ? el('a', {
          classNames: [RICH_TEXT_LINK],
          attributes: { href: literal(node.link.href) },
          children: node.link.runs.map(runMarkup),
        })
      : runMarkup(node.run),
  )

function blockMarkup(block: Block): MarkupElement {
  if (block.kind === 'paragraph') {
    return el('p', { classNames: [RICH_TEXT_PARAGRAPH], children: inlineMarkup(block.children) })
  }

  const items = block.items.map((item) => el('li', { children: inlineMarkup(item.children) }))

  return block.ordered
    ? el('ol', { classNames: [RICH_TEXT_ORDERED], children: items })
    : el('ul', { classNames: [RICH_TEXT_UNORDERED], children: items })
}

export const richTextMarkup = defineMarkup<RichTextProps>(
  ({ props: { content, size, measure, align, hidden } }) =>
    el('div', {
      classNames: [richTextStyles({ size, measure, align, hidden })],
      children: content.map(blockMarkup),
    }),
)
