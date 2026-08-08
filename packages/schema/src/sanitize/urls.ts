/**
 * FILE_FORMAT.md § Security, the URL rows. The allowlist is by scheme, not by pattern: `javascript:`
 * is the one everybody remembers, and an allowlist is what covers the ones nobody does.
 */
export const ALLOWED_SCHEMES = ['https:', 'http:', 'mailto:'] as const

/** Data URLs are allowed for images only, and only these types — the row below the URL row. */
export const ALLOWED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/avif',
  'image/gif',
] as const

/** 2 MB for an inline image, 4 kB for a blur placeholder. Both are the document's numbers. */
export const MAX_DATA_URL_BYTES = 2 * 1024 * 1024
export const MAX_BLUR_DATA_URL_BYTES = 4 * 1024

const SCHEME_RE = /^[a-zA-Z][a-zA-Z0-9+.-]*:/

/**
 * A control character inside a scheme is how a blocked one slips past a naive check: a browser strips
 * them before resolving, so a scheme written with an embedded newline resolves to the scheme this
 * function is here to reject. Anything carrying one is refused outright.
 */
// biome-ignore lint/suspicious/noControlCharactersInRegex: matching control characters is the point
const CONTROL_RE = /[\u0000-\u001f\u007f]/

/** A relative path or a fragment carries no scheme, and both are allowed. */
export function isSafeUrl(value: string): boolean {
  const trimmed = value.trim()

  if (trimmed === '' || CONTROL_RE.test(trimmed)) {
    return false
  }

  const scheme = SCHEME_RE.exec(trimmed)

  if (scheme === null) {
    return trimmed.startsWith('/') || trimmed.startsWith('#') || !trimmed.includes(':')
  }

  return (ALLOWED_SCHEMES as readonly string[]).includes(scheme[0].toLowerCase())
}

export interface DataUrlCheck {
  readonly ok: boolean
  readonly reason?: 'not-data-url' | 'type' | 'encoding' | 'size'
}

const DATA_URL_RE = /^data:([a-z]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/=]*)$/i

/** Base64 carries 3 bytes per 4 characters, minus the padding. */
const decodedBytes = (base64: string): number => {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0

  return Math.floor((base64.length * 3) / 4) - padding
}

export function checkImageDataUrl(value: string, maxBytes = MAX_DATA_URL_BYTES): DataUrlCheck {
  const match = DATA_URL_RE.exec(value)

  if (match === null) {
    return { ok: false, reason: value.startsWith('data:') ? 'encoding' : 'not-data-url' }
  }

  const type = (match[1] ?? '').toLowerCase()

  if (!(ALLOWED_IMAGE_TYPES as readonly string[]).includes(type)) {
    return { ok: false, reason: 'type' }
  }

  return decodedBytes(match[2] ?? '') > maxBytes ? { ok: false, reason: 'size' } : { ok: true }
}
