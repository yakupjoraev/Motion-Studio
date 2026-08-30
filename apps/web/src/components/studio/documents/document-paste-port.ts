/**
 * The seam between the paste shortcut and the import dialog — the same shape as the escape-hatch
 * port (ADR-279), and for a related reason: `editing-shortcuts.ts` is a module-level registry with no
 * React context in scope, and the thing it needs to reach is a provider's state.
 *
 * ADR-291 has why the shortcut asks at all. Nothing here imports anything at runtime.
 */
export type DocumentPasteHandler = (text: string, fileName: string) => void

let handler: DocumentPasteHandler | undefined

export const connectDocumentPaste = (next: DocumentPasteHandler | undefined): void => {
  handler = next
}

/**
 * A cheap shape test, run before the pipeline: the two required fields of the envelope. It is not
 * validation — `importDocument` does that, and reports what it found. This only answers "is this
 * paste meant for us, or is it someone's prose".
 */
export const looksLikeDocument = (text: string): boolean => {
  const trimmed = text.trimStart()

  return trimmed.startsWith('{') && trimmed.includes('"version"') && trimmed.includes('"nodes"')
}

export const PASTED_FILE_NAME = 'Pasted document.motion.json'

/**
 * Returns whether the paste was a document, so the caller knows whether to fall through to the block
 * paste. Reading the system clipboard can be refused — a permission prompt the user dismissed — and
 * a refusal is a "no", not an error: the block paste is still the right thing to do.
 */
export async function tryPasteDocument(): Promise<boolean> {
  if (handler === undefined || typeof navigator === 'undefined') {
    return false
  }

  const text = await navigator.clipboard.readText().catch(() => '')

  if (!looksLikeDocument(text)) {
    return false
  }

  handler(text, PASTED_FILE_NAME)

  return true
}
