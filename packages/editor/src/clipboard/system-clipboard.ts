import type { SerializedSubtree } from './clipboard.types'

/**
 * EDITOR_ENGINE.md § Clipboard. The payload goes out as `text/plain` behind this marker, which buys
 * two things at once: a paste into the studio is recognisable, and a paste into a code editor is
 * readable JSON rather than an opaque blob.
 */
export const CLIPBOARD_MARKER = '/* motion-studio:v1 */'

export const encodeClipboardText = (subtree: SerializedSubtree): string =>
  `${CLIPBOARD_MARKER}\n${JSON.stringify(subtree, null, 2)}`

/** The JSON behind the marker, or `null` for text this app did not write. */
export function decodeClipboardText(text: string): string | null {
  const trimmed = text.trimStart()

  return trimmed.startsWith(CLIPBOARD_MARKER) ? trimmed.slice(CLIPBOARD_MARKER.length) : null
}

/**
 * Feature-detected rather than assumed: the API needs a secure context, the permission can be denied,
 * and Firefox has no `readText` outside a paste event. Every failure is silent by design — the store
 * clipboard covers the same tab, so the user's copy still works and telling them about a permission
 * they cannot see would be noise.
 */
const clipboardApi = (): Clipboard | undefined => globalThis.navigator?.clipboard

export async function writeSystemClipboard(text: string): Promise<boolean> {
  const clipboard = clipboardApi()

  if (typeof clipboard?.writeText !== 'function') {
    return false
  }

  try {
    await clipboard.writeText(text)

    return true
  } catch {
    return false
  }
}

export async function readSystemClipboard(): Promise<string | null> {
  const clipboard = clipboardApi()

  if (typeof clipboard?.readText !== 'function') {
    return null
  }

  try {
    return await clipboard.readText()
  } catch {
    return null
  }
}
