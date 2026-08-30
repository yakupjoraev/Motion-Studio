import type { BlockDefinition, UnknownProps } from '@motion-studio/schema'

export interface UrlProps {
  readonly props: UnknownProps
  /** Prop names the query string carried and the schema would not take. */
  readonly rejected: readonly string[]
  /** Whether anything in the URL actually changed a default. */
  readonly modified: boolean
}

/**
 * The query string, in and out — `/blocks/aurora-background?blur=32&speed=0.6`.
 *
 * Only top-level props travel, and only the ones a control edits. The alternative is a serialisation
 * of the whole props object, which would put a block's every string into a shareable link and make a
 * URL longer than the code it describes.
 *
 * **Every value is parsed by the block's own schema, one prop at a time**, so one bad parameter costs
 * that parameter and not the page. `blur=banana` falls back to the default and is reported; it never
 * reaches the block, and it never throws.
 */
export function readParams(definition: BlockDefinition, params: URLSearchParams): UrlProps {
  const editable = editablePaths(definition)
  const defaults = definition.defaults as Record<string, unknown>
  const candidate: Record<string, unknown> = { ...defaults }
  const rejected: string[] = []
  let modified = false

  for (const [key, raw] of params) {
    if (!editable.has(key)) {
      continue
    }

    const decoded = decode(raw)
    const attempt = definition.propsSchema.safeParse({ ...candidate, [key]: decoded })

    if (attempt.success) {
      Object.assign(candidate, { [key]: (attempt.data as Record<string, unknown>)[key] })
      modified = true
    } else {
      rejected.push(key)
    }
  }

  const parsed = definition.propsSchema.safeParse(candidate)

  return parsed.success
    ? { props: parsed.data as UnknownProps, rejected, modified }
    : { props: defaults as UnknownProps, rejected: [...rejected, ...editable], modified: false }
}

/**
 * `replaceState`, not `pushState` — a slider dragged across its range is one intent, and a history
 * entry per commit would make the back button rewind the drag instead of leaving the page.
 *
 * A prop equal to its default is left out. A link should carry what the sender changed, not a census
 * of everything they did not.
 */
export function writeParams(definition: BlockDefinition, props: UnknownProps): void {
  const defaults = definition.defaults as Record<string, unknown>
  const values = props as Record<string, unknown>
  const params = new URLSearchParams()

  for (const path of editablePaths(definition)) {
    const value = values[path]

    if (value !== undefined && !same(value, defaults[path])) {
      params.set(path, encode(value))
    }
  }

  const query = params.toString()
  const url = query === '' ? window.location.pathname : `${window.location.pathname}?${query}`

  window.history.replaceState(null, '', url)
}

/** Top-level control paths only. A dot path addresses a nested object, which does not belong in a URL. */
export function editablePaths(definition: BlockDefinition): ReadonlySet<string> {
  const paths = new Set<string>()

  for (const group of definition.controls) {
    for (const control of group.controls) {
      if (!control.path.includes('.')) {
        paths.add(control.path)
      }
    }
  }

  return paths
}

/**
 * `32` is a number, `true` is a boolean, and everything else is the string it looks like. The schema
 * is what decides whether the guess was right, so a wrong guess is a rejected parameter rather than a
 * wrong value — which is why this can afford to be three lines instead of a type table.
 */
const decode = (raw: string): unknown => {
  if (raw === 'true') {
    return true
  }

  if (raw === 'false') {
    return false
  }

  if (raw !== '' && !Number.isNaN(Number(raw))) {
    return Number(raw)
  }

  return raw
}

const encode = (value: unknown): string =>
  typeof value === 'string' ? value : JSON.stringify(value)

const same = (a: unknown, b: unknown): boolean => a === b || JSON.stringify(a) === JSON.stringify(b)
