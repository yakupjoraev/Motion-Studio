import type {
  MarkupChild,
  MarkupElement,
  MarkupExpression,
  MarkupInput,
  MarkupProducer,
  MarkupSlot,
  MarkupText,
  MarkupValue,
  SlotGate,
} from './markup.types'

/**
 * The four things a producer writes — ADR-249. Pure functions, no dependency, so a producer stays
 * node-safe and the export path never meets React.
 *
 * They are here rather than in `packages/blocks` because `packages/codegen`'s own fixture catalogue
 * writes markup too, and one set of constructors is what keeps the two from drifting.
 */
export interface ElementInput {
  /** The same conditional list `classList` takes: `[BASE, active && ACTIVE]` reads as the JSX does. */
  readonly classNames?: readonly (string | false | undefined)[]
  readonly attributes?: Readonly<Record<string, MarkupValue>>
  readonly children?: readonly MarkupChild[]
  readonly cssVars?: Readonly<Record<string, string>>
  readonly notes?: readonly string[]
  readonly key?: string
  readonly slotGate?: SlotGate
}

/**
 * `cva` returns one space-separated string; the IR wants a list, and an empty class list is an
 * element with no `className` at all rather than one with an empty attribute.
 */
export const classList = (...classes: readonly (string | false | undefined)[]): readonly string[] =>
  classes
    .filter((entry): entry is string => typeof entry === 'string' && entry !== '')
    .flatMap((entry) => entry.split(/\s+/))
    .filter((entry) => entry !== '')

export function el(tag: string, input: ElementInput = {}): MarkupElement {
  return {
    kind: 'element',
    tag,
    classNames: input.classNames === undefined ? [] : classList(...input.classNames),
    attributes: input.attributes ?? {},
    children: input.children ?? [],
    ...(input.cssVars === undefined ? {} : { cssVars: input.cssVars }),
    ...(input.notes === undefined ? {} : { notes: input.notes }),
    ...(input.key === undefined ? {} : { key: input.key }),
    ...(input.slotGate === undefined ? {} : { slotGate: input.slotGate }),
  }
}

/** Static text. Content that came from a prop uses `ref` instead, so pass 6 can extract it. */
export const txt = (value: string): MarkupText => ({ kind: 'text', value })

export const expr = (code: string): MarkupExpression => ({ kind: 'expression', code })

/** A prop of the emitted component: `{headline}` when props are extracted, its value when they are not. */
export const ref = (name: string): MarkupValue => ({ kind: 'reference', name })

export const literal = (value: string | number | boolean): MarkupValue => ({
  kind: 'literal',
  value,
})

/** Where the document's children go. Resolved away before any printer sees the tree. */
export const slot = (name = 'children'): MarkupSlot => ({ kind: 'slot', name })

/** A prop reference as a child, which is the common case: an element whose text is one prop. */
export const refText = (name: string): MarkupExpression => expr(name)

/** Drops the absent branches of a conditional list, so a producer reads as markup rather than as pushes. */
export const children = (
  ...entries: readonly (MarkupChild | false | undefined | null)[]
): readonly MarkupChild[] =>
  entries.filter((entry): entry is MarkupChild => entry !== false && entry != null)

/**
 * The typed door into the markup registry, mirroring `defineBlock`. A producer is written against its
 * block's own props type; the registry holds them all under `UnknownProps`, and a function type is
 * contravariant in its parameter, so the widening happens here once instead of at seventy-two call
 * sites.
 *
 * The cast is backed by a real parse: `buildElement` runs the block's own schema over the node's props
 * before it calls the producer, and falls back to the block's defaults when they do not parse — the
 * same rule the canvas follows (ADR-149).
 */
export const defineMarkup =
  <P>(producer: MarkupProducer<P>): MarkupProducer =>
  (input) =>
    producer(input as MarkupInput<P>)
