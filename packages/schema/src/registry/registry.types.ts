import type { ZodType, ZodTypeDef } from 'zod'

import type { BlockId } from '../ids/ids'
import type { MotionChannel, MotionSpec } from '../motion/motion.types'

/**
 * The seam between `editor` / `canvas` / `codegen` and `blocks` — ARCHITECTURE.md § The registry seam.
 *
 * **No React types anywhere in this file.** That is what lets `codegen` run in `node` and what makes
 * the editor testable with a three-entry fake and no component tree. `RenderRegistry` is therefore
 * `Record<BlockId, unknown>` here and is refined to a component map in `packages/blocks`, which is the
 * only package allowed to know that a block renders with React.
 */
export type UnknownProps = Record<string, unknown>

export const BLOCK_CATEGORIES = {
  layout: 'Layout',
  hero: 'Hero',
  content: 'Content',
  marketing: 'Marketing',
  navigation: 'Navigation',
  interactive: 'Interactive',
  data: 'Data',
  forms: 'Forms',
  effects: 'Effects',
} as const

export type BlockCategory = keyof typeof BLOCK_CATEGORIES

/** COMPONENT_LIBRARY.md § Control kinds — one implementation each in `packages/ui/src/controls/`. */
export const CONTROL_KINDS = [
  'text',
  'textarea',
  'richText',
  'number',
  'slider',
  'stepper',
  'select',
  'segmented',
  'switch',
  'color',
  'gradient',
  'shadow',
  'spacing',
  'radius',
  'align',
  'font',
  'image',
  'icon',
  'link',
  'list',
  'motion',
  'effect',
  'css',
] as const

export type ControlKind = (typeof CONTROL_KINDS)[number]

export interface ControlDescriptor {
  /** Dot path into the block's props. */
  readonly path: string
  readonly kind: ControlKind
  readonly label: string
  readonly hint?: string
  /** Shows the breakpoint override affordance. Layout and size controls have it; content usually does not. */
  readonly responsive?: boolean
  /** Kind-specific metadata — `min`, `options`, `itemControls`. Each control owns its own shape. */
  readonly options?: Readonly<Record<string, unknown>>
}

export interface ControlGroup {
  readonly id: string
  readonly label: string
  readonly controls: readonly ControlDescriptor[]
}

/** Which axis a slot lays its children out along — DRAG_AND_DROP.md § Drop position resolution. */
export type SlotOrientation = 'vertical' | 'horizontal' | 'grid'

export interface SlotDefinition {
  readonly name: string
  readonly label: string
  /** `'*'` accepts anything; a predicate lets a slot decide from the candidate's own definition. */
  readonly accepts: readonly BlockId[] | '*' | ((definition: BlockDefinition) => boolean)
  readonly minChildren: number
  readonly maxChildren: number | null
  readonly defaultChildren?: readonly BlockId[]
  /**
   * ADR-130. A drop compares the pointer against child midpoints, and which midpoint — the top edge,
   * the left edge, or the nearest cell — is a fact about this block's own layout at these props. Only
   * the block can answer it, so the block says it here rather than the drag layer guessing from a
   * prop name or reading a computed style. Absent means vertical.
   */
  readonly orientation?: ((props: UnknownProps) => SlotOrientation) | undefined
}

export interface BlockCapabilities {
  readonly resizable: boolean
  readonly fullWidth: boolean
  /** Glass blocks need something behind them to blur. */
  readonly requiresBackdrop: boolean
  readonly supportsMotion: readonly MotionChannel[]
  readonly costClass: 'cheap' | 'moderate' | 'heavy'
  readonly minWidth?: number | undefined
  /**
   * ADR-115. The block only does anything inside a flex parent — a fluid spacer is `flex-1`. The
   * inspector hints, and drop resolution reads the same field rather than knowing the block by id.
   */
  readonly requiresFlexParent?: boolean | undefined
  /**
   * RESPONSIVE_ENGINE.md § Container queries. The block's own cells respond to the width they are
   * given rather than to the viewport, so it draws a `container-type: inline-size` element around
   * each one and sizes its contents with `@sm:` / `@md:` classes.
   *
   * Not the default, and the reason is the canvas: a `@container` inside a transform-scaled artboard
   * measures the untransformed width, so a cell at zoom 0.5 answers the same query it would answer at
   * 1. That is right for the export and slightly wrong for the preview, which is a trade only the
   * blocks that need it should pay (ADR-167 deferred the field here for its first real caller).
   */
  readonly containerQuery?: boolean | undefined
}

export interface ImportSpec {
  readonly from: string
  readonly named?: readonly string[]
  readonly default?: string
  readonly typeOnly?: boolean
}

/**
 * How a block becomes code. It carries only what EXPORT_ENGINE.md § buildIR reads off the registry:
 * the element a node prints as, the imports that element needs, and the packages the emitted
 * `package.json` must install. The printers themselves live in `packages/codegen` and arrive with the
 * prompts that build it; adding a field here later is additive and breaks nothing.
 */
/**
 * The schema.org types a block can ask the export to emit beside it. A union rather than a string,
 * because a printer has to know the shape it is writing — ADR-194.
 */
export const STRUCTURED_DATA_TYPES = ['FAQPage', 'BreadcrumbList'] as const

export type StructuredDataType = (typeof STRUCTURED_DATA_TYPES)[number]

/**
 * Whether the React printer writes `'use client'` above this block's component — the one question
 * EXPORT_ENGINE.md § React cannot answer from the markup, because markup does not say whether the
 * component it came from holds state.
 *
 * `whenAnyProp` is for a block that is interactive only at some prop sets: `carousel` with no arrows, no
 * dots and no autoplay prints as a scroll-snap strip with no handler in it. The condition is prop *names*
 * rather than a predicate so a meta-test can check them against the schema, the way `enabledBy` is
 * checked — a closure would be expressive and unverifiable (ADR-199).
 *
 * `reason` is not decoration: the printer may emit it as a comment, and it is what a reader compares the
 * directive against.
 */
export type ClientBoundary =
  | { readonly kind: 'always'; readonly reason: string }
  | { readonly kind: 'never'; readonly reason: string }
  | { readonly kind: 'whenAnyProp'; readonly props: readonly string[]; readonly reason: string }

/**
 * A module the export writes beside the component, for the block whose export cannot import what it
 * needs. `theme-toggle` calls the theme engine's `setColorMode` and the user's project has no theme
 * engine in it, so the twelve statements travel here and the component imports them from `path`.
 *
 * Two blocks naming the same `path` emit it once — ADR-201.
 */
export interface RuntimeModule {
  /** Relative to the emitted project root, e.g. `lib/color-mode.ts`. */
  readonly path: string
  readonly named: readonly string[]
  readonly source: string
}

export interface CodegenDescriptor {
  /** `'section'`, `'div'`, or a component name the import below provides. */
  readonly tag: string
  readonly imports?: readonly ImportSpec[]
  /** Package name → semver range, accumulated so the emitted project installs and runs. */
  readonly dependencies?: Readonly<Record<string, string>>
  /** Props that print as attributes rather than as classes. */
  readonly passthroughProps?: readonly string[]
  /**
   * Comments the printers emit above the element, verbatim. For the one thing generated markup cannot
   * say for itself: where the reader has to plug something in. `newsletter-form` ships a no-op submit
   * handler, and an export that did not say so would look finished while doing nothing.
   */
  readonly notes?: readonly string[]
  /**
   * Structured data the export emits beside the element, which the canvas never renders — a
   * `<script type="application/ld+json">` inside an artboard would be markup the user cannot see,
   * cannot select, and would carry into a screenshot of their page.
   *
   * `enabledBy` is the boolean prop that turns it on, so the printer reads the user's answer rather
   * than emitting it for everyone.
   */
  readonly structuredData?: {
    readonly type: StructuredDataType
    readonly enabledBy: string
  }
  /**
   * **Absent is not `never`.** A printer that met an undeclared block would have to guess, and both
   * guesses are wrong in one direction: `never` ships a page that throws in the browser, `always` costs
   * the reader every Server Component in the tree. So the export fails and says which block — ADR-199.
   */
  readonly client?: ClientBoundary
  readonly runtimeModule?: RuntimeModule
}

export interface A11yNotes {
  readonly role?: string
  readonly notes: readonly string[]
}

export interface BlockDefinition<P = UnknownProps> {
  readonly id: BlockId
  readonly name: string
  readonly description: string
  readonly category: BlockCategory
  readonly tags: readonly string[]
  /** An icon *name*, not a component: this file stays free of React. */
  readonly icon: string

  /**
   * The input type is `unknown` on purpose: a schema whose props carry `.default()` parses a partial
   * object into a complete one, so its input is not its output, and pinning both would reject every
   * schema in the catalogue.
   */
  readonly propsSchema: ZodType<P, ZodTypeDef, unknown>
  readonly defaults: P
  /** What the palette thumbnail shows. */
  readonly previewProps: P

  readonly slots: readonly SlotDefinition[]
  readonly controls: readonly ControlGroup[]
  readonly capabilities: BlockCapabilities
  readonly defaultMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>>
  readonly codegen: CodegenDescriptor
  readonly a11y: A11yNotes
}

export interface BlockRegistry {
  get(id: BlockId): BlockDefinition | undefined
  /** Throws. For the paths where a missing block is a programmer mistake rather than bad input. */
  require(id: BlockId): BlockDefinition
  list(): readonly BlockDefinition[]
  byCategory(category: BlockCategory): readonly BlockDefinition[]
}

/**
 * Deliberately `unknown`: the value is a React component, and naming that here would put React in the
 * package that `codegen` imports to run under `node`. `packages/blocks` narrows it.
 */
export type RenderRegistry = Readonly<Record<string, unknown>>
