/**
 * ADR-042. A link's value is a URL, not CSS, so ADR-040's round-trip rule does not apply to it: the
 * grammar here is the one browsers and `href` already define.
 */

/** What a generated page may legally navigate to. Everything else is a scheme we refuse to emit. */
const ALLOWED_SCHEMES = new Set(['http:', 'https:', 'mailto:', 'tel:'])

/** `javascript:` is script injection; `data:` and `blob:` are documents smuggled into a link. */
const REFUSED_SCHEMES = new Set(['javascript:', 'data:', 'blob:', 'vbscript:', 'file:'])

const SCHEME = /^([a-z][a-z0-9+.-]*:)/i

/** A relative path, a query, or an in-page anchor: no scheme, and nothing to check a scheme against. */
function isRelative(href: string): boolean {
  return (
    href.startsWith('/') || href.startsWith('#') || href.startsWith('?') || href.startsWith('.')
  )
}

/**
 * The problem with this `href`, in a sentence, or `null` when there is none. A message rather than a
 * boolean, because `ACCESSIBILITY.md` § Inspector wants the reason announced and not only the state.
 */
export function hrefIssue(href: string): string | null {
  const trimmed = href.trim()

  if (trimmed === '') {
    return 'Enter a URL.'
  }

  if (isRelative(trimmed)) {
    return null
  }

  const scheme = SCHEME.exec(trimmed)?.[1]?.toLowerCase()

  if (scheme === undefined) {
    return 'Add a scheme, such as https://, or start the path with a slash.'
  }

  if (REFUSED_SCHEMES.has(scheme)) {
    return `${scheme} links are not allowed.`
  }

  if (!ALLOWED_SCHEMES.has(scheme)) {
    return `${scheme} is not a scheme this exports.`
  }

  // A scheme alone is not a destination: `https://` has no host.
  if (scheme.startsWith('http') && trimmed.replace(SCHEME, '').replace(/^\/\//, '') === '') {
    return 'Add a host after the scheme.'
  }

  return null
}

export type LinkTarget = '_self' | '_blank'

/** The `rel` tokens the inspector offers. `noopener` is the one that closes a real hole. */
export const REL_TOKENS = ['noopener', 'noreferrer', 'nofollow'] as const

export type RelToken = (typeof REL_TOKENS)[number]

/**
 * A new tab that can reach back through `window.opener` is the hole `noopener` closes. Modern browsers
 * imply it for `target="_blank"`, older ones do not, and the generated page has to hold up in both.
 */
export function relIssue(target: LinkTarget, rel: readonly string[]): string | null {
  if (target === '_blank' && !rel.includes('noopener')) {
    return 'A link that opens a new tab should carry rel="noopener".'
  }

  return null
}
