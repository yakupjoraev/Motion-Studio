import type { NodeId } from '@motion-studio/schema'

/**
 * EXPORT_ENGINE.md § Warnings. Seven categories, each with the section of the Bible that explains what
 * to do about it — a warning a reader cannot act on is a warning that trains them to ignore the list.
 *
 * Warnings never block. Anything that must stop an export is an error, and there is exactly one:
 * a block whose descriptor does not declare its client boundary (ADR-199, ADR-227).
 */
export const WARNING_CODES = [
  'approximation',
  'missing-alt',
  'contrast',
  'unsupported',
  'dependency',
  'perf',
  'a11y',
] as const

export type WarningCode = (typeof WARNING_CODES)[number]

export interface IRWarning {
  readonly code: WarningCode
  readonly message: string
  readonly nodeId?: NodeId
  readonly docsLink: string
}

/** Code → the document section a reader opens next. Relative, because the docs site serves them. */
export const WARNING_DOCS: Readonly<Record<WarningCode, string>> = {
  approximation: 'docs/EXPORT_ENGINE.md#html',
  'missing-alt': 'docs/ACCESSIBILITY.md',
  contrast: 'docs/THEME_ENGINE.md',
  unsupported: 'docs/EXPORT_ENGINE.md#buildir',
  dependency: 'docs/TECH_STACK.md',
  perf: 'docs/PERFORMANCE.md',
  a11y: 'docs/ACCESSIBILITY.md',
}

export function warning(code: WarningCode, message: string, nodeId?: NodeId): IRWarning {
  return nodeId === undefined
    ? { code, message, docsLink: WARNING_DOCS[code] }
    : { code, message, nodeId, docsLink: WARNING_DOCS[code] }
}

/**
 * The bytes at which `assets: 'inline'` stops being a convenience — EXPORT_ENGINE.md § Asset handling
 * warns above 200 kB of base64 across the document.
 */
export const INLINE_ASSET_BUDGET = 200 * 1024
