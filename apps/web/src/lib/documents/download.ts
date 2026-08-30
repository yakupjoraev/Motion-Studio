import { type MotionDocument, serializeDocument } from '@motion-studio/schema'
import { kebab } from '@motion-studio/utils'

/** A single `Blob` handed to the browser. Revoked on the next frame; the click has already happened. */
export function saveBlob(blob: Blob, name: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')

  anchor.href = url
  anchor.download = name
  anchor.click()

  requestAnimationFrame(() => URL.revokeObjectURL(url))
}

/** `landing-page.motion.json` — the extension FILE_FORMAT.md gives the format, kebab from the name. */
export function documentFileName(name: string): string {
  const stem = kebab(name)

  return `${stem === '' ? 'document' : stem}.motion.json`
}

/**
 * The escape hatch behind every failure in this subsystem: a storage write that failed, a file that
 * was repaired, a file that was rejected. The user's work leaves the browser as a file they hold,
 * which is the only answer to "storage is full" that does not end in lost work.
 */
export function downloadDocument(document: MotionDocument): void {
  saveBlob(
    new Blob([serializeDocument(document)], { type: 'application/json' }),
    documentFileName(document.meta.name),
  )
}

/** The unmodified bytes, for "Download original": a repair must never destroy the only copy. */
export function downloadText(contents: string, name: string): void {
  saveBlob(new Blob([contents], { type: 'application/json' }), name)
}
