import { validateCssValue } from '@motion-studio/schema/css'
import { type Result, err, ok } from '@motion-studio/utils'

import { type PlaygroundProperty, isPlaygroundProperty } from '../properties'

/**
 * `#p=box-shadow&v=<base64url>` — PLAYGROUND.md § Sharing. A state that travels without a backend.
 *
 * **A permalink is untrusted input.** Anyone can hand anyone a URL, so the decode runs the same
 * validator an imported `.motion` file runs and refuses anything it refuses; nothing is applied on
 * the strength of having arrived in a hash.
 */
export const MAX_HASH_BYTES = 4096

export interface PermalinkState {
  readonly property: PlaygroundProperty
  readonly value: string
}

const encodeBase64Url = (value: string): string => {
  const bytes = new TextEncoder().encode(value)
  let binary = ''

  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }

  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const decodeBase64Url = (encoded: string): string | undefined => {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/')

  try {
    const binary = atob(padded)
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0))

    return new TextDecoder().decode(bytes)
  } catch {
    // Not base64. That is an answer, not an exception the caller should have to catch.
    return undefined
  }
}

/** The hash, or the reason there is not one. Over the cap the caller offers the clipboard instead. */
export function encodePermalink(state: PermalinkState): Result<string, string> {
  const hash = `#p=${encodeURIComponent(state.property)}&v=${encodeBase64Url(state.value)}`

  return hash.length > MAX_HASH_BYTES
    ? err(`Too long to link: ${hash.length} characters, the cap is ${MAX_HASH_BYTES}.`)
    : ok(hash)
}

export function decodePermalink(hash: string): Result<PermalinkState, string> {
  if (hash.length > MAX_HASH_BYTES) {
    return err('That link is longer than the cap and was not read.')
  }

  const params = new URLSearchParams(hash.replace(/^#/, ''))
  const property = params.get('p') ?? ''
  const encoded = params.get('v')

  if (encoded === null || !isPlaygroundProperty(property)) {
    return err('That link does not name a sandbox.')
  }

  const value = decodeBase64Url(encoded)

  if (value === undefined) {
    return err('That link’s value is not readable.')
  }

  const checked = validateCssValue(property, value)

  return checked.ok
    ? ok({ property, value: checked.normalized })
    : err(checked.errors[0]?.message ?? 'That link carries a value this browser refuses.')
}
