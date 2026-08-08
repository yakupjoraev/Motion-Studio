import { MotionStudioError, type Result, err, ok } from '@motion-studio/utils'

import { documentSchema, versionProbeSchema } from '../document/document.schema'
import type { MotionDocument, UnknownDocument } from '../document/document.types'

/** The **schema** version, independent of the app version — FILE_FORMAT.md § Versioning. */
export const CURRENT_VERSION = 1

export interface Migration {
  readonly from: number
  readonly to: number
  readonly description: string
  migrate(document: UnknownDocument): UnknownDocument
}

/**
 * Append-only. A shipped migration is never edited, because somebody's file depends on exactly what
 * it did — FILE_FORMAT.md § Migration rules. Migrations are pure: no registry, no clock, no
 * randomness; an id generator, if one is ever needed, is injected.
 *
 * Empty at version 1, and that is not a placeholder: an additive field with a Zod `.default()` parses
 * an old document without one, so the version is bumped only when the shape changes incompatibly.
 */
export const migrations: readonly Migration[] = []

export const MIGRATION_CODES = {
  unreadable: 'UNREADABLE',
  futureVersion: 'FUTURE_VERSION',
  noPath: 'NO_PATH',
  invalidAfterMigration: 'INVALID_AFTER_MIGRATION',
} as const

export type MigrationCode = (typeof MIGRATION_CODES)[keyof typeof MIGRATION_CODES]

export class MigrationError extends MotionStudioError {
  readonly detail: unknown

  constructor(code: MigrationCode, message: string, detail?: unknown) {
    super(message, code)
    this.detail = detail
  }
}

/**
 * The version gate of the import pipeline. Every failure is a typed error rather than a throw: a
 * document from the future is a thing a user did, not a bug, and the dialog needs to say which of the
 * four things went wrong.
 */
export function migrateDocument(input: unknown): Result<MotionDocument, MigrationError> {
  const versioned = versionProbeSchema.safeParse(input)

  if (!versioned.success) {
    return err(
      new MigrationError(
        MIGRATION_CODES.unreadable,
        'This file does not declare a schema version',
        versioned.error.issues,
      ),
    )
  }

  let document = input as UnknownDocument
  let version = versioned.data.version

  if (version > CURRENT_VERSION) {
    return err(
      new MigrationError(
        MIGRATION_CODES.futureVersion,
        `This file was made with a newer version (schema ${version}, this build reads ${CURRENT_VERSION})`,
        { found: version, supported: CURRENT_VERSION },
      ),
    )
  }

  while (version < CURRENT_VERSION) {
    const migration = migrations.find((candidate) => candidate.from === version)

    if (migration === undefined) {
      return err(
        new MigrationError(MIGRATION_CODES.noPath, `Cannot upgrade from version ${version}`, {
          from: version,
        }),
      )
    }

    document = migration.migrate(document)
    version = migration.to
  }

  const parsed = documentSchema.safeParse(document)

  return parsed.success
    ? ok(parsed.data)
    : err(
        new MigrationError(
          MIGRATION_CODES.invalidAfterMigration,
          'The upgraded file does not match the current schema',
          parsed.error.issues,
        ),
      )
}
