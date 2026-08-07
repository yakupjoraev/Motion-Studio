import { escapeHtml } from '@motion-studio/utils'

import { hrefIssue } from '../link-field/index'

/**
 * The three kinds of inline formatting prompt 09 allows, canonicalised: `b` and `i` are what
 * `execCommand` produces, `strong` and `em` are what carries meaning, and only one pair survives.
 */
const CANONICAL: Readonly<Record<string, string>> = {
  B: 'strong',
  STRONG: 'strong',
  I: 'em',
  EM: 'em',
  A: 'a',
}

function serialise(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    return escapeHtml(node.textContent ?? '')
  }

  if (!(node instanceof Element)) {
    return ''
  }

  const inner = [...node.childNodes].map(serialise).join('')
  const tag = CANONICAL[node.tagName]

  if (tag === undefined) {
    // Unwrapped rather than dropped: a pasted `<div>` carries text that must survive its wrapper.
    return inner
  }

  if (tag !== 'a') {
    return inner === '' ? '' : `<${tag}>${inner}</${tag}>`
  }

  const href = node.getAttribute('href') ?? ''

  // The same scheme policy `LinkField` enforces — ADR-042. A link that fails it keeps its text.
  return hrefIssue(href) === null ? `<a href="${escapeHtml(href)}">${inner}</a>` : inner
}

/**
 * Everything outside bold, italic and a safe link is removed, and the text inside it is kept. This runs on
 * what the field produces as well as on what is pasted into it, so the value never holds markup the
 * exporter would have to decide about later.
 */
export function sanitizeRichText(html: string): string {
  const document_ = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')

  return [...document_.body.childNodes].map(serialise).join('')
}

/** What a paste is allowed to contribute: its text, and none of its formatting. */
export function plainText(html: string): string {
  const document_ = new DOMParser().parseFromString(`<body>${html}</body>`, 'text/html')

  return document_.body.textContent ?? ''
}
