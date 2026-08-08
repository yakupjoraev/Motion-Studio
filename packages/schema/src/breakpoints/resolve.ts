import { BREAKPOINTS, type BreakpointId, CASCADE_ORDER } from './breakpoints'

/** The part of a node this resolution reads. Taking the fields rather than the node keeps it usable on a draft. */
export interface ResponsiveSource {
  readonly props: Readonly<Record<string, unknown>>
  readonly responsive: Readonly<Partial<Record<BreakpointId, Record<string, unknown>>>>
}

/**
 * RESPONSIVE_ENGINE.md § Resolution. **Cascading, not exact-match**: editing at `lg` while `md` holds
 * an override means `lg` inherits the `md` value, exactly like CSS.
 *
 * Resolving only the exact breakpoint is the single most common bug in this class of tool, and it
 * produces a document that looks right in the editor and broken in the browser. Both directions are
 * tested — that `md` is visible at `lg`, and that an `lg` override does not leak down to `md`.
 *
 * A key that is not a known breakpoint is ignored rather than throwing: `responsive` comes out of an
 * untrusted file, and a document from a newer version may carry a breakpoint this build has never
 * heard of.
 */
export function resolveResponsiveProps<P extends object>(
  node: ResponsiveSource,
  breakpoint: BreakpointId,
): P {
  let resolved: Record<string, unknown> = { ...node.props }

  for (const id of CASCADE_ORDER) {
    if (BREAKPOINTS[id].min > BREAKPOINTS[breakpoint].min) {
      break
    }

    const override = node.responsive[id]

    if (override !== undefined) {
      resolved = { ...resolved, ...override }
    }
  }

  return resolved as P
}
