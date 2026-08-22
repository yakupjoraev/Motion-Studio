import { type MotionDocument, serializeDocument } from '@motion-studio/schema'

import type { ExportResult } from '../printer.types'

/**
 * The JSON target — `EXPORT_ENGINE.md` § JSON, in full: "`serializeDocument` from FILE_FORMAT.md.
 * Byte-stable." This file adds a file name and nothing else.
 *
 * It takes the document rather than a `CodegenIR` (ADR-240): nothing the IR decided appears in the
 * output, and byte-stability is a property of `serializeDocument` that a second walk here would be free
 * to break. `.motion` files diff cleanly in git because there is exactly one serialiser.
 */
export interface JsonPrintInput {
  readonly document: MotionDocument
}

/** `Landing page` → `landing-page.motion.json`, so a download does not land as `document.json`. */
export function documentFileName(document: MotionDocument): string {
  const slug = document.meta.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `${slug === '' ? 'document' : slug}.motion.json`
}

export function printJsonTarget(input: JsonPrintInput): ExportResult {
  return {
    files: [
      {
        path: documentFileName(input.document),
        contents: `${serializeDocument(input.document)}\n`,
      },
    ],
    warnings: [],
    dependencies: {},
  }
}
