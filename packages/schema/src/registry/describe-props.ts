import { type ZodTypeAny, z } from 'zod'

import type { BlockDefinition, ControlDescriptor } from './registry.types'

export interface PropRow {
  readonly name: string
  /** What the schema accepts, written the way a TypeScript signature would write it. */
  readonly type: string
  /** The default, printed. `—` when the schema has none, which means the prop is required. */
  readonly defaultValue: string
  readonly description: string
  readonly responsive: boolean
}

/**
 * The props table, read off the block's own Zod schema — `prompts/52`: "A hand-maintained props table
 * is stale documentation waiting to happen."
 *
 * It lives here rather than in the page that renders it because this is where Zod lives: describing a
 * schema is a fact about the registry, and a table built in `apps/web` would have put Zod in an app
 * that has no other use for it.
 *
 * The *description* is the one column the schema cannot supply. Block schemas carry their reasoning
 * in TypeScript comments rather than in `.describe()`, and the sentence a reader wants is already
 * written next to the control that edits the prop — so it comes from the control descriptor, and a
 * prop with no control has no sentence rather than an invented one.
 */
export function describeProps(definition: BlockDefinition): readonly PropRow[] {
  const shape = objectShape(definition.propsSchema as ZodTypeAny)

  if (shape === null) {
    return []
  }

  const controls = new Map<string, ControlDescriptor>()
  for (const group of definition.controls) {
    for (const control of group.controls) {
      controls.set(control.path, control)
    }
  }

  const defaults = definition.defaults as Record<string, unknown>

  return Object.entries(shape).map(([name, schema]) => {
    const control = controls.get(name)

    return {
      name,
      type: describeType(schema),
      defaultValue: name in defaults ? print(defaults[name]) : '—',
      description: control?.hint ?? control?.label ?? '',
      responsive: control?.responsive === true,
    }
  })
}

const objectShape = (schema: ZodTypeAny): Record<string, ZodTypeAny> | null => {
  const unwrapped = unwrap(schema)

  return unwrapped instanceof z.ZodObject ? (unwrapped.shape as Record<string, ZodTypeAny>) : null
}

/** Past the wrappers a default or an optional adds, to the type that describes the value. */
function unwrap(schema: ZodTypeAny): ZodTypeAny {
  let current = schema

  while (
    current instanceof z.ZodDefault ||
    current instanceof z.ZodOptional ||
    current instanceof z.ZodNullable ||
    current instanceof z.ZodCatch
  ) {
    current =
      current instanceof z.ZodDefault || current instanceof z.ZodCatch
        ? (current._def.innerType as ZodTypeAny)
        : (current.unwrap() as ZodTypeAny)
  }

  return current
}

/**
 * A signature, not a Zod dump. `'accent' | 'info'` is what a reader will type; `ZodEnum` is what we
 * happen to have used to say so.
 */
function describeType(schema: ZodTypeAny): string {
  const inner = unwrap(schema)

  if (inner instanceof z.ZodEnum) {
    return (inner.options as readonly string[]).map((option) => `'${option}'`).join(' | ')
  }

  if (inner instanceof z.ZodLiteral) {
    return print(inner.value)
  }

  if (inner instanceof z.ZodUnion) {
    return (inner.options as readonly ZodTypeAny[]).map(describeType).join(' | ')
  }

  if (inner instanceof z.ZodArray) {
    return `${describeType(inner.element as ZodTypeAny)}[]`
  }

  if (inner instanceof z.ZodNumber) {
    return withRange('number', inner)
  }

  if (inner instanceof z.ZodString) {
    return 'string'
  }

  if (inner instanceof z.ZodBoolean) {
    return 'boolean'
  }

  if (inner instanceof z.ZodObject) {
    return `{ ${Object.keys(inner.shape as object).join(', ')} }`
  }

  return 'unknown'
}

/**
 * A bounded number is a different prop from an unbounded one, and the bounds are in the schema.
 *
 * `minValue` and `maxValue`, not `min` and `max`: in Zod 3 those two are the *builders*, so reading
 * them gives a function and prints it.
 */
function withRange(base: string, schema: z.ZodNumber): string {
  const min = schema.minValue
  const max = schema.maxValue

  if (min === null && max === null) {
    return base
  }

  return `${base} (${min ?? '−∞'}…${max ?? '∞'})`
}

function print(value: unknown): string {
  if (typeof value === 'string') {
    return `'${value}'`
  }

  if (value === undefined) {
    return '—'
  }

  return JSON.stringify(value) ?? String(value)
}
