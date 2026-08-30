import {
  type BlockRegistry,
  type MotionDocument,
  type Repair,
  migrateDocument,
  repairDocument,
  sanitizeDocument,
  validateDocument,
  validateProps,
} from '@motion-studio/schema'
import { type Result, err, ok } from '@motion-studio/utils'

/** FILE_FORMAT.md § Import, one code per box of the diagram. */
export const IMPORT_STAGES = {
  size: 'SIZE',
  parse: 'PARSE',
  migrate: 'MIGRATE',
  schema: 'SCHEMA',
  validate: 'VALIDATE',
} as const

export type ImportStage = (typeof IMPORT_STAGES)[keyof typeof IMPORT_STAGES]

/** FILE_FORMAT.md § Import. Measured on the text, before the parse — ADR-287. */
export const MAX_FILE_BYTES = 10 * 1024 * 1024

export interface ImportRejection {
  readonly stage: ImportStage
  /** One line, in the dialog's heading: "Not valid JSON (line 42)". */
  readonly title: string
  readonly detail: string
}

export interface ImportNote {
  /** `⚠` for something that was changed, `ⓘ` for something the user should know but nothing changed. */
  readonly tone: 'warning' | 'info'
  readonly count: number
  readonly message: string
}

export interface ImportSuccess {
  readonly document: MotionDocument
  readonly notes: readonly ImportNote[]
}

export type ImportOutcome = Result<ImportSuccess, ImportRejection>

/** `JSON.parse` reports an offset, and a line number is what a person can act on. */
const lineOf = (text: string, error: unknown): string => {
  const position = /position (\d+)/.exec(error instanceof Error ? error.message : '')?.[1]

  if (position === undefined) {
    return 'Not valid JSON'
  }

  return `Not valid JSON (line ${text.slice(0, Number(position)).split('\n').length})`
}

/** The first issue, as `meta.canvas.width: Expected number` — a path a person can go and look at. */
const fieldPath = (detail: unknown): string => {
  const issue = Array.isArray(detail) ? (detail[0] as { path?: unknown; message?: unknown }) : null

  if (issue === null || !Array.isArray(issue.path) || typeof issue.message !== 'string') {
    return 'The document failed schema validation.'
  }

  return `${issue.path.join('.')}: ${issue.message}`
}

const plural = (count: number, one: string, many: string): string =>
  `${count} ${count === 1 ? one : many}`

/** The report's copy. One line per repair kind, with the count the dialog is judged on. */
const noteFor = (repair: Repair): ImportNote => {
  const count = repair.nodeIds.length

  switch (repair.kind) {
    case 'DROPPED_ORPHAN':
      return {
        tone: 'warning',
        count,
        message: `${plural(count, 'orphan block', 'orphan blocks')} removed`,
      }
    case 'REMOVED_MISSING_CHILD':
      return {
        tone: 'warning',
        count,
        message: `${plural(count, 'reference', 'references')} to a missing block removed`,
      }
    case 'REBUILT_PARENT':
      return {
        tone: 'warning',
        count,
        message: `${plural(count, 'parent reference', 'parent references')} rebuilt from children`,
      }
    case 'DEDUPLICATED_CHILDREN':
      return {
        tone: 'warning',
        count,
        message: `${plural(count, 'duplicate child entry', 'duplicate child entries')} removed`,
      }
    case 'UNKNOWN_BLOCK':
      return {
        tone: 'info',
        count,
        message: `${plural(count, 'block is', 'blocks are')} not available and ${
          count === 1 ? 'renders' : 'render'
        } as a placeholder`,
      }
    default:
      return {
        tone: 'warning',
        count,
        message: `${plural(count, 'block', 'blocks')} had props this version rejects; the valid ones were kept`,
      }
  }
}

/**
 * The pipeline of FILE_FORMAT.md § Import, in order, with the documented error at every stage.
 *
 * It returns a rejection rather than throwing at every stage, because none of these is a bug: a file
 * from a newer version, a file with a cycle and a file that is not JSON are all things a user did,
 * and the dialog has to say which one.
 */
export function importDocument(text: string, registry: BlockRegistry): ImportOutcome {
  if (text.length > MAX_FILE_BYTES) {
    return err({
      stage: IMPORT_STAGES.size,
      title: 'File too large',
      detail: 'A .motion file is capped at 10 MB. This one is larger and was not opened.',
    })
  }

  let parsed: unknown

  try {
    parsed = JSON.parse(text)
  } catch (error) {
    return err({
      stage: IMPORT_STAGES.parse,
      title: lineOf(text, error),
      detail: 'The file could not be read as JSON, so nothing in it could be checked.',
    })
  }

  /*
   * `migrateDocument` ends in `documentSchema.parse`, so it owns two boxes of the diagram. They stay
   * two rejections: the version gate and the schema are different things to have got wrong, and the
   * dialog reports the field path for the second.
   */
  const migrated = migrateDocument(parsed)

  if (!migrated.ok) {
    if (migrated.error.code === 'INVALID_AFTER_MIGRATION') {
      return err({
        stage: IMPORT_STAGES.schema,
        title: 'This file does not match the document format',
        detail: fieldPath(migrated.error.detail),
      })
    }

    return err({
      stage: IMPORT_STAGES.migrate,
      title:
        migrated.error.code === 'FUTURE_VERSION'
          ? 'Made with a newer version'
          : migrated.error.message,
      detail: migrated.error.message,
    })
  }

  const notes: ImportNote[] = []
  let document = migrated.value

  // Validation is what *decides* whether a repair is needed. Repairing unconditionally would rewrite
  // `parentId` on a file that had nothing wrong with it, and report it.
  if (!validateDocument(document, { registry }).ok) {
    const repaired = repairDocument(document, { registry })

    if (!repaired.ok) {
      const first = repaired.error[0]

      return err({
        stage: IMPORT_STAGES.validate,
        title:
          first?.code === 'CYCLE' ? 'This document contains a loop' : 'This document has no root',
        detail:
          first?.message ??
          'The document breaks an invariant that cannot be repaired without guessing.',
      })
    }

    document = repaired.value.document
    notes.push(...repaired.value.repairs.map(noteFor))
  }

  // Non-fatal by design — FILE_FORMAT.md § Schema. `repairDocument` already merged what it could;
  // anything still invalid here belongs to a block the registry does not have.
  const props = validateProps(document, registry)

  if (props.invalidProps.length > 0 && !notes.some((note) => note.message.includes('props'))) {
    notes.push({
      tone: 'info',
      count: props.invalidProps.length,
      message: `${plural(props.invalidProps.length, 'block', 'blocks')} kept props this version does not use`,
    })
  }

  const sanitized = sanitizeDocument(document)

  if (sanitized.removed.length > 0) {
    notes.push({
      tone: 'warning',
      count: sanitized.removed.length,
      message: `${plural(sanitized.removed.length, 'unsafe value', 'unsafe values')} removed`,
    })
  }

  return ok({ document: sanitized.document, notes })
}
