/**
 * FILE_FORMAT.md § Security, the rich-text row: bold, italic, code and a safe link survive; anything
 * else is dropped and its text is kept.
 *
 * This is a **DOM-free** parser, because the schema package runs in `node` and is what validates an
 * imported file. `packages/ui` sanitises the *editor's* value with `DOMParser`, which is the right
 * tool for what a paste puts on the clipboard. ADR-051 records that pairing and what keeps the two
 * policies the same.
 */
import { escapeHtml } from '@motion-studio/utils'

import { isSafeUrl } from './urls'

/** `b`/`i` are what a contenteditable produces; `strong`/`em` are what carries meaning. */
const CANONICAL: Readonly<Record<string, string>> = {
  b: 'strong',
  strong: 'strong',
  i: 'em',
  em: 'em',
  code: 'code',
  a: 'a',
}

/** Their text is markup, not content, so it goes with the tag rather than being unwrapped. */
const DROP_CONTENT = new Set(['script', 'style', 'iframe', 'object', 'embed', 'template'])

const TAG_RE = /<\/?([a-zA-Z][a-zA-Z0-9-]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/g
const HREF_RE = /href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i

interface OpenTag {
  readonly tag: string
  readonly emitted: boolean
}

export function sanitizeRichText(html: string): string {
  let result = ''
  let index = 0
  let dropDepth = 0
  const open: OpenTag[] = []

  const text = (value: string): void => {
    if (dropDepth === 0 && value !== '') {
      result += escapeHtml(value)
    }
  }

  for (const match of html.matchAll(TAG_RE)) {
    const at = match.index

    text(html.slice(index, at))
    index = at + match[0].length

    const name = (match[1] ?? '').toLowerCase()
    const attributes = match[2] ?? ''
    const closing = match[0].startsWith('</')

    if (DROP_CONTENT.has(name)) {
      dropDepth += closing ? -1 : 1
      dropDepth = Math.max(dropDepth, 0)
      continue
    }

    if (dropDepth > 0) {
      continue
    }

    const canonical = CANONICAL[name]

    if (closing) {
      const last = open.pop()

      if (last?.emitted === true) {
        result += `</${last.tag}>`
      }

      continue
    }

    // An unknown tag is unwrapped rather than dropped: a pasted `<div>` carries text that must survive.
    if (canonical === undefined) {
      open.push({ tag: name, emitted: false })
      continue
    }

    if (canonical !== 'a') {
      open.push({ tag: canonical, emitted: true })
      result += `<${canonical}>`
      continue
    }

    const href = HREF_RE.exec(attributes)
    const value = href?.[2] ?? href?.[3] ?? href?.[4] ?? ''

    if (isSafeUrl(value)) {
      open.push({ tag: 'a', emitted: true })
      result += `<a href="${escapeHtml(value)}">`
    } else {
      // The link fails the scheme policy, so it keeps its text and loses its href.
      open.push({ tag: 'a', emitted: false })
    }
  }

  text(html.slice(index))

  // A document can end mid-element; close what is still open so the value is well-formed.
  while (open.length > 0) {
    const last = open.pop()

    if (last?.emitted === true) {
      result += `</${last.tag}>`
    }
  }

  return result
}
