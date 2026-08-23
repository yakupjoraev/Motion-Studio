import { DEFAULT_EXPORT_OPTIONS } from '@motion-studio/codegen/options'
import { commands } from '@motion-studio/editor'
import {
  type MotionDocument,
  type NodeId,
  blockId,
  createEmptyDocument,
  nodeId,
} from '@motion-studio/schema'
import { beforeEach, describe, expect, it } from 'vitest'

import { useStudioStore } from '../../../store/editor-store'

import { buildExportIR, copyEntry, printExport, printedTheme } from './run-export'

const state = () => useStudioStore.getState()

let counter = 0

const nextId = (): NodeId => {
  counter += 1

  return nodeId(`node_x${counter}`)
}

const insert = (parentId: NodeId, block: string): NodeId => {
  const id = nextId()

  state().dispatch(
    commands.insertBlock({ blockId: blockId(block), parentId, index: 0, slot: 'children', id }),
  )

  return id
}

/** A page with two sections in it, built the way the editor builds one. */
const landing = (): { document: MotionDocument; second: NodeId } => {
  state().replaceDocument(createEmptyDocument({ ids: () => nextId() }))

  const root = state().document.rootId

  insert(root, 'section')

  const second = insert(root, 'hero-centered')

  return { document: state().document, second }
}

const options = { ...DEFAULT_EXPORT_OPTIONS, format: false }

beforeEach(() => {
  counter = 0
})

describe('the export pipeline, run from the studio', () => {
  it('builds an IR from the shipped catalogue rather than refusing it (ADR-243)', () => {
    const { document } = landing()
    const ir = buildExportIR({ document, options })

    expect(ir).not.toBeNull()
    expect(ir?.components.length).toBeGreaterThan(0)
  })

  it('prints files for the code targets', () => {
    const { document } = landing()
    const ir = buildExportIR({ document, options })
    const printed = printExport({ document, options }, ir)

    expect(printed.files.map((file) => file.path)).toContain('index.ts')
  })

  it('reads no IR for the two data targets — ADR-236 and ADR-240', () => {
    const { document } = landing()
    const target = { ...options, target: 'json' } as const

    expect(buildExportIR({ document, options: target })).toBeNull()
    expect(printExport({ document, options: target }, null).files).toHaveLength(1)
  })

  it('prints the tokens target from the theme alone', () => {
    const { document } = landing()
    const target = { ...options, target: 'tokens' } as const

    expect(printExport({ document, options: target }, null).files.length).toBeGreaterThan(1)
  })

  it('returns the same printed theme object for the same config', () => {
    const { document } = landing()

    expect(printedTheme(document.theme)).toBe(printedTheme(document.theme))
  })

  it('copies one component for a selection, not the whole page', async () => {
    const { document, second } = landing()
    const file = await copyEntry({
      document,
      options: { ...options, scope: 'selection' },
      selection: second,
    })
    const whole = printExport({ document, options }, buildExportIR({ document, options }))

    expect(file.contents).toContain('export function')
    expect(whole.files.length).toBeGreaterThan(1)
  })

  it('names the selection as the file it copied', async () => {
    const { document, second } = landing()
    const file = await copyEntry({
      document,
      options: { ...options, scope: 'selection' },
      selection: second,
    })

    expect(file.path).toMatch(/\.tsx?$/)
  })
})
