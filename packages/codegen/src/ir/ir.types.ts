import type { MotionPresetRegistry } from '@motion-studio/motion'
import type {
  BlockRegistry,
  ImportSpec,
  MotionDocument,
  NodeId,
  StructuredDataType,
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

export type IRValue =
  | { readonly kind: 'literal'; readonly value: string | number | boolean }
  | { readonly kind: 'expression'; readonly code: string }
  | { readonly kind: 'reference'; readonly name: string }

export interface IRText {
  readonly kind: 'text'
  readonly value: string
}

export interface IRExpression {
  readonly kind: 'expression'
  readonly code: string
}

export type IRChild = IRElement | IRText | IRExpression

/**
 * A preset that reached this element, recorded rather than the animation it produced — ADR-239. The
 * React and Next printers never read it; the HTML target reads it and nothing else, because the CSS a
 * preset degrades to is a decision only that target makes.
 */
export interface IRElementMotion {
  readonly presetId: string
  readonly engine: 'css' | 'motion' | 'gsap'
  readonly channel: string
}

export interface IRElement {
  readonly kind: 'element'
  /** `'div'`, `'section'`, `'motion.div'`, or the name of another component in this export. */
  readonly tag: string
  /** Already variant-ordered and conflict-merged — ADR-224. A printer joins them and stops. */
  readonly classNames: readonly string[]
  readonly attributes: Readonly<Record<string, IRValue>>
  readonly children: readonly IRChild[]
  readonly cssVars?: Readonly<Record<string, string>>
  /** The descriptor's `notes`, emitted as comments above the element. */
  readonly notes?: readonly string[]
  /** The presets pass 4 applied here, for a target that cannot print them — ADR-239. */
  readonly motion?: readonly IRElementMotion[]
  /** Already gated on the descriptor's `enabledBy` prop — ADR-194. */
  readonly structuredData?: StructuredDataType
  readonly key?: string
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
  readonly options?: Partial<ExportOptions>
  /** Required by `scope: 'selection'`, ignored otherwise. */
  readonly selection?: NodeId
}
