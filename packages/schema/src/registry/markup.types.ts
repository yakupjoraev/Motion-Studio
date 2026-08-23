import type { StructuredDataType, UnknownProps } from './registry.types'

/**
 * The markup vocabulary — ADR-249. It lives here rather than in `codegen` because both halves of the
 * export need it and neither may import the other: `packages/blocks` writes these nodes and
 * `packages/codegen` prints them, and `schema` is the one package both are allowed to depend on.
 *
 * `codegen` re-exports every type below under its `IR*` names, which is what the printers were written
 * against.
 */
export type MarkupValue =
  | { readonly kind: 'literal'; readonly value: string | number | boolean }
  | { readonly kind: 'expression'; readonly code: string }
  /** A prop of the emitted component. Pass 6 either prints `{name}` or substitutes the value. */
  | { readonly kind: 'reference'; readonly name: string }

export interface MarkupText {
  readonly kind: 'text'
  readonly value: string
}

export interface MarkupExpression {
  readonly kind: 'expression'
  readonly code: string
}

/**
 * A preset that reached this element, recorded rather than the animation it produced — ADR-239. Only
 * the HTML target reads it, because the CSS a preset degrades to is that target's decision alone.
 */
export interface MarkupMotion {
  readonly presetId: string
  readonly engine: 'css' | 'motion' | 'gsap'
  readonly channel: string
}

export interface MarkupElement {
  readonly kind: 'element'
  /** `'div'`, `'section'`, `'motion.div'`, or the name of another component in this export. */
  readonly tag: string
  /** A producer emits its own `cva` output; `buildElement` orders and merges it — ADR-224. */
  readonly classNames: readonly string[]
  readonly attributes: Readonly<Record<string, MarkupValue>>
  readonly children: readonly MarkupChild[]
  readonly cssVars?: Readonly<Record<string, string>>
  /** Comments the printers emit above the element, verbatim. */
  readonly notes?: readonly string[]
  readonly motion?: readonly MarkupMotion[]
  /** Already gated on the descriptor's `enabledBy` prop — ADR-194. */
  readonly structuredData?: StructuredDataType
  readonly key?: string
}

/**
 * Where the document's own children go. A producer places it; `buildElement` replaces it with the
 * elements it builds for that slot, so a printer never meets one — which is why the authoring union
 * below is wider than the printing union in `codegen`.
 */
export interface MarkupSlot {
  readonly kind: 'slot'
  readonly name: string
}

export type MarkupChild = MarkupElement | MarkupText | MarkupExpression | MarkupSlot

/**
 * What a producer is handed. Deliberately only the props: a producer that branched on an export
 * option would be producing two different outputs for one block, and choosing between them is pass
 * 6's job, not a block's.
 */
export interface MarkupInput<P = UnknownProps> {
  readonly props: P
}

/**
 * A block's own markup, as data the printers already understand — ADR-249. It is code rather than a
 * declaration because the catalogue holds 771 elements and 261 conditionals, and it is safe rather
 * than merely convenient because `registry.markup.test.tsx` compares its DOM with the component's.
 */
export type MarkupProducer<P = UnknownProps> = (input: MarkupInput<P>) => MarkupElement

/** `blockId` → producer. Injected into `buildIR`, the way the block registry and the presets are. */
export type MarkupRegistry = Readonly<Record<string, MarkupProducer>>
