import { describe, expect, it } from 'vitest'

import { fixtureDocuments } from '../document/__fixtures__/documents'
import { documentSchema } from '../document/document.schema'
import { validateDocument } from '../document/validate'

import v1 from './__fixtures__/v1-document.json'
import {
  CURRENT_VERSION,
  MIGRATION_CODES,
  type Migration,
  migrateDocument,
  migrations,
} from './index'

describe('the migration list', () => {
  it('is a chain with no gaps and no branches', () => {
    const seen = new Set<number>()

    for (const migration of migrations) {
      expect(migration.to).toBe(migration.from + 1)
      expect(seen.has(migration.from)).toBe(false)
      seen.add(migration.from)
    }
  })

  it('reaches CURRENT_VERSION from the oldest version it claims to read', () => {
    const oldest = migrations.reduce(
      (lowest: number, migration: Migration) => Math.min(lowest, migration.from),
      CURRENT_VERSION,
    )

    let version = oldest

    while (version < CURRENT_VERSION) {
      const step = migrations.find((migration) => migration.from === version)

      expect(step, `no migration from version ${version}`).toBeDefined()
      version = (step as Migration).to
    }

    expect(version).toBe(CURRENT_VERSION)
  })
})

describe('migrateDocument', () => {
  it('loads the oldest fixture and validates it at the end of the chain', () => {
    const result = migrateDocument(v1)

    expect(result.ok).toBe(true)

    if (result.ok) {
      expect(result.value.version).toBe(CURRENT_VERSION)
      expect(validateDocument(result.value).ok).toBe(true)
    }
  })

  it.each(fixtureDocuments().map((document, index) => [index, document] as const))(
    'passes fixture %i through untouched at the current version',
    (_index, document) => {
      const result = migrateDocument(JSON.parse(JSON.stringify(document)))

      expect(result.ok).toBe(true)
    },
  )

  it('reports a file with no version rather than throwing', () => {
    const result = migrateDocument({ nodes: {} })

    expect(result.ok).toBe(false)
    expect(result.ok ? null : result.error.code).toBe(MIGRATION_CODES.unreadable)
  })

  it('reports a document from a newer version', () => {
    const result = migrateDocument({ ...v1, version: CURRENT_VERSION + 1 })

    expect(result.ok ? null : result.error.code).toBe(MIGRATION_CODES.futureVersion)
  })

  it('reports when no path exists from the version it was given', () => {
    const result = migrateDocument({ ...v1, version: 0.5 })

    // 0.5 fails the positive-integer probe before the chain is consulted.
    expect(result.ok ? null : result.error.code).toBe(MIGRATION_CODES.unreadable)
  })

  it('reports a file that upgrades into something the schema still rejects', () => {
    const result = migrateDocument({ ...v1, rootId: 'not-an-id' })

    expect(result.ok ? null : result.error.code).toBe(MIGRATION_CODES.invalidAfterMigration)
  })

  it('never throws, whatever it is handed', () => {
    for (const input of [null, 42, 'x', [], {}, { version: -1 }, { version: Number.NaN }]) {
      expect(() => migrateDocument(input)).not.toThrow()
    }
  })
})

describe('the v1 fixture', () => {
  it('is a real document rather than a hand-waved one', () => {
    expect(documentSchema.safeParse(v1).success).toBe(true)
  })
})
