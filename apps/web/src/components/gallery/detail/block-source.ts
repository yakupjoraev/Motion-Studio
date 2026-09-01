import { markupRegistry } from '@motion-studio/blocks/markup'
import { blockRegistry } from '@motion-studio/blocks/registry'
import { buildIR, printReact, resolveOptions } from '@motion-studio/codegen'
// The subpath, not the barrel: the barrel re-exports the framer-motion applier, and this module is
// what `use-source.ts` imports at runtime — 34.7 KiB of it in `/blocks/[slug]`'s load (ADR-320).
import { presetRegistry } from '@motion-studio/motion/presets'
import { type BlockId, type MotionDocument, type UnknownProps, nodeId } from '@motion-studio/schema'
import { studioDark } from '@motion-studio/theme'

/** One node, one id, and the same id every time — a source sample that churned would be a diff. */
const NODE = nodeId('node_preview')
const FIXED_TIME = '2026-01-01T00:00:00.000Z'

/**
 * The block, alone, as a document the exporter will take.
 *
 * `scope: 'selection'` on a one-node document is exactly the pipeline behind the studio's **Copy
 * React**, which is what makes the answer here the same answer there. `prompts/52`: "A hand-written
 * snippet would drift within a week and would be a lie."
 */
export function blockDocument(id: BlockId, props: UnknownProps): MotionDocument {
  const definition = blockRegistry.require(id)

  return {
    version: 1,
    meta: {
      id: 'doc_gallery',
      name: definition.name,
      createdAt: FIXED_TIME,
      updatedAt: FIXED_TIME,
      generator: 'motion-studio@0.0.0',
      canvas: { width: 1440, background: 'surface-0' },
    },
    theme: studioDark,
    rootId: NODE,
    nodes: {
      [NODE]: {
        id: NODE,
        blockId: definition.id,
        name: definition.name,
        parentId: null,
        slot: 'root',
        children: [],
        props: props as Record<string, unknown>,
        responsive: {},
        motion: structuredClone(definition.defaultMotion),
        effects: [],
        locked: false,
        hidden: false,
      },
    },
    assets: {},
  }
}

export interface PrintedSource {
  readonly path: string
  readonly contents: string
}

/**
 * The printed component. **Not formatted**, and that is a decision rather than an omission.
 *
 * The studio's dialog runs Prettier, which ADR-253 measured at 99 ms of a 114 ms export and which
 * arrives as 180 kB of parser. This page reprints on every commit of a control, in a browser, on a
 * page whose whole promise is that a developer is in and out in a minute — so it shows what the
 * printer produced, which is already indented, and spends the 180 kB on nothing.
 *
 * The consequence is stated where a reader will meet it: the bytes here differ from a formatted
 * export in whitespace, and in nothing else. `block-source.test.ts` asserts that against `printReact`
 * rather than against a snapshot, so the claim is checked and not just made.
 */
export function printBlockSource(id: BlockId, props: UnknownProps): PrintedSource {
  const options = resolveOptions({ target: 'react', scope: 'selection', includeTheme: false })

  const ir = buildIR({
    document: blockDocument(id, props),
    registry: blockRegistry,
    presets: presetRegistry,
    markup: markupRegistry,
    options,
    selection: NODE,
  })

  const printed = printReact({ ir, options })
  const entry = ir.components.find((component) => component.name === ir.entry)?.fileName
  const file = printed.files.find((one) => one.path === entry) ?? printed.files[0]

  if (file === undefined) {
    throw new Error(`The export produced no file for ${id}`)
  }

  return { path: file.path, contents: file.contents }
}
