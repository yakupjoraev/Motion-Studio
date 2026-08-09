import type {
  A11yNotes,
  BlockCapabilities,
  BlockCategory,
  BlockId,
  CodegenDescriptor,
  ControlDescriptor,
  MotionChannel,
  MotionSpec,
  SlotDefinition,
} from '@motion-studio/schema'
import type { TypeOf, ZodType } from 'zod'

/**
 * ADR-103. Top-level keys plus dot paths through nested objects, three levels deep — every shape in
 * the catalogue except an index into an array, which is a value and not a type. The meta-test walks
 * the schema for the rest.
 */
type Depth = [never, 0, 1, 2, 3]

export type ControlPath<T, D extends number = 3> = [D] extends [never]
  ? never
  : T extends readonly unknown[]
    ? never
    : T extends object
      ? {
          [K in keyof T & string]: K | `${K}.${ControlPath<NonNullable<T[K]>, Depth[D]> & string}`
        }[keyof T & string]
      : never

/** A control whose path the compiler checks against the block's own props. */
export type TypedControl<P> = Omit<ControlDescriptor, 'path'> & { readonly path: ControlPath<P> }

export interface TypedControlGroup<P> {
  readonly id: string
  readonly label: string
  readonly controls: readonly TypedControl<P>[]
}

export interface DefineBlockConfig<S extends ZodType> {
  readonly id: BlockId
  readonly name: string
  readonly description: string
  readonly category: BlockCategory
  readonly tags: readonly string[]
  /** An icon name from `packages/icons`; the definition stays free of React. */
  readonly icon: string
  readonly propsSchema: S
  readonly defaults: TypeOf<S>
  readonly previewProps: TypeOf<S>
  readonly slots: readonly SlotDefinition[]
  readonly controls: readonly TypedControlGroup<TypeOf<S>>[]
  readonly capabilities: BlockCapabilities
  readonly defaultMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>>
  readonly codegen: CodegenDescriptor
  readonly a11y: A11yNotes
}
