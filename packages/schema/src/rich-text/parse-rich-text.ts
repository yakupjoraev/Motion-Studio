import { decodeHtml, escapeHtml } from '@motion-studio/utils'

import { isSafeUrl } from '../sanitize/urls'

import {
  MAX_BLOCKS,
  MAX_CHILDREN,
  MAX_HREF_LENGTH,
  MAX_LIST_ITEMS,
  MAX_RUN_LENGTH,
} from './rich-text.schema'
import type {
  RichTextBlock,
  RichTextDocument,
  RichTextInline,
  RichTextMark,
  RichTextRun,
} from './rich-text.types'

/**
 * HTML in, AST out. DOM-free, for ADR-051's first reason: this package runs under `node` and is what
 * validates an imported file.
 *
 * The policy is an **allowlist of productions**, not a denylist of tags. A tag that is not one of the
 * eight below contributes nothing but its text, so `<script>`, `<iframe>`, `onclick=` and a
 * `javascript:` href are not special cases that had to be thought of — they are simply not productions
 * this function can emit. That is the property the AST buys and a sanitised string cannot.
 */
const MARK_TAGS: Readonly<Record<string, RichTextMark>> = {
  b: 'strong',
  strong: 'strong',
  i: 'em',
  em: 'em',
  code: 'code',
}

/** Their text is markup, not content, so it leaves with the tag instead of being unwrapped. */
const DROP_CONTENT = new Set([
  'script',
  'style',
  'iframe',
  'object',
  'embed',
  'template',
  'noscript',
])

const BLOCK_BREAK = new Set([
  'p',
  'div',
  'br',
  'section',
  'article',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
])

const TAG_RE = /<\/?([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*)\/?>/g
const HREF_RE = /href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i

interface Builder {
  marks: RichTextMark[]
  href: string | null
  children: RichTextInline[]
  items: RichTextInline[][]
  ordered: boolean
  inList: boolean
  blocks: RichTextBlock[]
}

const emptyRun = (run: RichTextRun): boolean => run.text === ''

/** Marks are a set, and a stable order keeps two equal values equal — the history compares by value. */
const orderedMarks = (marks: readonly RichTextMark[]): RichTextMark[] =>
  (['strong', 'em', 'code'] as const).filter((mark) => marks.includes(mark))

function pushText(state: Builder, raw: string): void {
  const text = decodeHtml(raw).slice(0, MAX_RUN_LENGTH)
  const run: RichTextRun = { text, marks: orderedMarks(state.marks) }

  if (emptyRun(run)) {
    return
  }

  const target = state.inList ? (state.items.at(-1) ?? []) : state.children

  if (target.length >= MAX_CHILDREN) {
    return
  }

  if (state.href !== null) {
    const last = target.at(-1)

    // Consecutive runs inside one anchor belong to that anchor rather than to the paragraph.
    if (last?.kind === 'link' && last.link.href === state.href) {
      target[target.length - 1] = {
        kind: 'link',
        link: { href: last.link.href, runs: [...last.link.runs, run] },
      }

      return
    }

    target.push({ kind: 'link', link: { href: state.href, runs: [run] } })

    return
  }

  target.push({ kind: 'run', run })
}

function closeParagraph(state: Builder): void {
  if (state.children.length === 0 || state.blocks.length >= MAX_BLOCKS) {
    state.children = []

    return
  }

  state.blocks.push({ kind: 'paragraph', children: state.children })
  state.children = []
}

function closeList(state: Builder): void {
  const items = state.items.filter((children) => children.length > 0).slice(0, MAX_LIST_ITEMS)

  if (items.length > 0 && state.blocks.length < MAX_BLOCKS) {
    state.blocks.push({
      kind: 'list',
      ordered: state.ordered,
      items: items.map((children) => ({ children })),
    })
  }

  state.items = []
  state.inList = false
}

export function parseRichText(html: string): RichTextDocument {
  const state: Builder = {
    marks: [],
    href: null,
    children: [],
    items: [],
    ordered: false,
    inList: false,
    blocks: [],
  }

  let index = 0
  let dropDepth = 0

  for (const match of html.matchAll(TAG_RE)) {
    const at = match.index

    if (dropDepth === 0) {
      pushText(state, html.slice(index, at))
    }

    index = at + match[0].length

    const name = (match[1] ?? '').toLowerCase()
    const attributes = match[2] ?? ''
    const closing = match[0].startsWith('</')

    if (DROP_CONTENT.has(name)) {
      dropDepth = Math.max(dropDepth + (closing ? -1 : 1), 0)
      continue
    }

    if (dropDepth > 0) {
      continue
    }

    const mark = MARK_TAGS[name]

    if (mark !== undefined) {
      if (closing) {
        const found = state.marks.lastIndexOf(mark)

        if (found !== -1) {
          state.marks.splice(found, 1)
        }
      } else if (!state.marks.includes(mark)) {
        state.marks.push(mark)
      }

      continue
    }

    if (name === 'a') {
      if (closing) {
        state.href = null

        continue
      }

      const href = HREF_RE.exec(attributes)
      const value = (href?.[2] ?? href?.[3] ?? href?.[4] ?? '').slice(0, MAX_HREF_LENGTH)

      // A link whose scheme fails the allowlist keeps its text and loses its href — the text was
      // content, the href was the payload.
      state.href = isSafeUrl(value) ? decodeHtml(value) : null

      continue
    }

    if (name === 'ul' || name === 'ol') {
      if (closing) {
        closeList(state)
      } else {
        closeParagraph(state)
        state.inList = true
        state.ordered = name === 'ol'
        state.items = []
      }

      continue
    }

    if (name === 'li') {
      if (!closing && state.inList && state.items.length < MAX_LIST_ITEMS) {
        state.items.push([])
      }

      continue
    }

    if (BLOCK_BREAK.has(name) && !state.inList) {
      closeParagraph(state)
    }
  }

  if (dropDepth === 0) {
    pushText(state, html.slice(index))
  }

  if (state.inList) {
    closeList(state)
  }

  closeParagraph(state)

  return state.blocks
}

const renderRun = (value: RichTextRun): string =>
  value.marks.reduce((inner, mark) => `<${mark}>${inner}</${mark}>`, escapeHtml(value.text))

const renderInline = (nodes: readonly RichTextInline[]): string =>
  nodes
    .map((node) =>
      node.kind === 'link'
        ? `<a href="${escapeHtml(node.link.href)}">${node.link.runs.map(renderRun).join('')}</a>`
        : renderRun(node.run),
    )
    .join('')

/**
 * The inverse, for the editing surface. The contenteditable in `packages/ui` speaks HTML, the document
 * stores the AST, and this is the seam between them — so a round trip through the editor is
 * `parseRichText(richTextToHtml(value))` and has to return the value it started with. The test asserts
 * exactly that, because a round trip that loses a mark loses a user's work.
 */
export function richTextToHtml(document: RichTextDocument): string {
  return document
    .map((block) => {
      if (block.kind === 'paragraph') {
        return `<p>${renderInline(block.children)}</p>`
      }

      const tag = block.ordered ? 'ol' : 'ul'

      return `<${tag}>${block.items.map((item) => `<li>${renderInline(item.children)}</li>`).join('')}</${tag}>`
    })
    .join('')
}
