import type { MotionPresetRegistry } from '@motion-studio/motion'
import type {
  BlockRegistry,
  ImportSpec,
  MarkupElement,
  MarkupExpression,
  MarkupMotion,
  MarkupRegistry,
  MarkupText,
  MarkupValue,
  MotionDocument,
  NodeId,
} from '@motion-studio/schema'

import type { ExportOptions } from '../options.types'
import type { IRWarning } from '../warnings'

/**
 * EXPORT_ENGINE.md § The IR. Every decision the export makes is a field here: the printers read this
 * and nothing else, which is what keeps four targets from re-solving naming, hoisting and dedupe.
 */
export type ComponentName = string

/**
 * The theme the printers write out. `config` travels whole rather than resolved because resolution
 * lives in `packages/theme` — a dependency `codegen` does not take (ARCHITECTURE.md § Dependency
 * graph, rule 3), and the four fields above it are the ones passes 3 and 4 read for themselves.
 */
export interface IRTheme {
  readonly id: string
  readonly name: string
  readonly colorMode: 'light' | 'dark' | 'system'
  readonly fontPairing: string
  readonly radiusScale: number
  readonly spacingScale: number
  /** Multiplies every duration a motion fragment prints — ADR-141. */
  readonly motionScale: number
  readonly config: MotionDocument['theme']
}

/**
 * The markup vocabulary is `packages/schema`'s — ADR-249. It is aliased rather than restated because
 * `packages/blocks` writes these nodes and the printers read them, and neither package may import the
 * other. The `IR*` names stay: they are what the printers were written against.
 */
export type IRValue = MarkupValue
export type IRText = MarkupText
export type IRExpression = MarkupExpression

/**
 * What a printer meets. Narrower than `MarkupChild` on purpose: a producer may write a `slot`, and
 * `buildElement` resolves every one of them into the elements it built for that slot.
 */
export type IRChild = IRElement | IRText | IRExpression

export type IRElementMotion = MarkupMotion

/**
 * One element, as the printers read it: `classNames` variant-ordered and conflict-merged (ADR-224),
 * every slot resolved, every child an element, a text or an expression.
 */
export interface IRElement extends Omit<MarkupElement, 'children' | 'slotGate'> {
  readonly children: readonly IRChild[]
}

export interface IRProp {
  readonly name: string
  readonly type: 'string' | 'number' | 'boolean' | 'json'
  readonly defaultValue: IRValue
}

export interface HoistedConst {
  readonly name: string
  /** The whole statement, `const fadeUpVariants = { … }`, as the preset wrote it. */
  readonly code: string
}

/**
 * Whether the React printer writes `'use client'` above this component, and the sentence a reader
 * compares the directive against. Resolved here rather than in the printer — ADR-227.
 */
export interface IRClient {
  readonly emit: boolean
  readonly reason: string
}

export interface IRRule {
  readonly selector: string
  readonly declarations: readonly string[]
  /** A media query the rule sits inside, e.g. `(min-width: 768px)`. */
  readonly media?: string
}

export interface IRStylesheet {
  readonly rules: readonly IRRule[]
  /** `@keyframes` blocks and custom-property declarations, as the presets wrote them. */
  readonly keyframes: readonly string[]
}

/** A `runtimeModule` the export writes beside the components, deduped by path — ADR-201. */
export interface IRModule {
  readonly path: string
  readonly named: readonly string[]
  readonly source: string
}

export interface IRAsset {
  readonly id: string
  readonly kind: 'image' | 'video'
  /** What the element's `src` becomes: a URL, a data URL, or a path under `public/`. */
  readonly src: string
  readonly width: number
  readonly height: number
  readonly alt: string
  readonly blurDataUrl?: string
  /** Set by `assets: 'bundle'`: where the file is written, relative to the project root. */
  readonly bundlePath?: string
  /** Base64 length under `assets: 'inline'`, so the report can name the total. */
  readonly bytes: number
}

export interface IRComponent {
  readonly name: ComponentName
  readonly fileName: string
  readonly props: readonly IRProp[]
  readonly imports: readonly ImportSpec[]
  readonly hoisted: readonly HoistedConst[]
  readonly hooks: readonly string[]
  readonly client: IRClient
  readonly root: IRElement
  readonly usedClasses: readonly string[]
}

export interface CodegenIR {
  readonly components: readonly IRComponent[]
  readonly entry: ComponentName
  /**
   * `document.meta.name`. The Next target spends it three times — the package name, `metadata.title`
   * and the README heading — and a name derived from a component would be one the author never wrote.
   */
  readonly documentName: string
  readonly theme: IRTheme
  readonly assets: readonly IRAsset[]
  readonly stylesheet: IRStylesheet
  readonly modules: readonly IRModule[]
  /** Package name → semver range, so the emitted `package.json` installs and runs. */
  readonly dependencies: Readonly<Record<string, string>>
  readonly warnings: readonly IRWarning[]
}

/**
 * One named object rather than four positional registries — ADR-226. `presets` is injected for the
 * same reason `ResolveContext` injects it (ADR-138): importing the catalogue would put React in this
 * package's runtime graph.
 */
export interface BuildIRInput {
  readonly document: MotionDocument
  readonly registry: BlockRegistry
  readonly presets: MotionPresetRegistry
  /**
   * The markup producers — ADR-249, injected for ADR-226's reason: they live in `packages/blocks`,
   * which `codegen` may not import. A block with no producer exports as its root element alone,
   * which is what every block did before the producers existed.
   */
  readonly markup?: MarkupRegistry
  readonly options?: Partial<ExportOptions>
  /** Required by `scope: 'selection'`, ignored otherwise. */
  readonly selection?: NodeId
}
