import type { MotionDocument } from '@motion-studio/schema'

import { lastOf } from './error-context'

/**
 * The clipboard payload behind every "Copy report" button — `prompts/58` § Error report.
 *
 * **Nothing is sent anywhere.** This builds a string; a button puts it on the clipboard; a person
 * decides whether to paste it into an issue. That is stated in the UI too, because a user who is
 * asked to press a button labelled "report" is right to assume it phones home.
 *
 * **It carries no document content.** The document appears as two counts and a theme name — never a
 * heading, a URL, a price or a prop value. A crash report is pasted in public, and the document is
 * the user's unreleased work.
 */
export interface ErrorReportInput {
  readonly error: unknown
  /** `NODE_PROPS_INVALID` where a typed error carries one — CODE_STANDARDS.md § Errors. */
  readonly code?: string
  readonly blockId?: string
  readonly nodeId?: string
  readonly document?: Pick<MotionDocument, 'nodes' | 'theme'> | null
  readonly appVersion: string
  /** Injected, because `navigator` is absent on the server and stubbed in tests. */
  readonly userAgent?: string
}

const errorLine = (error: unknown): string => {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`
  }

  return `Error: ${String(error)}`
}

const stackOf = (error: unknown): string =>
  error instanceof Error && typeof error.stack === 'string' ? error.stack : '(no stack)'

/**
 * "Chrome 121 / macOS" from a user-agent string, and the raw string when it does not parse.
 *
 * A short form because the whole string is a fingerprint: it carries the build number, the device
 * model on mobile, and on some browsers the installed extensions' tokens.
 */
const describeBrowser = (userAgent: string | undefined): string => {
  if (userAgent === undefined || userAgent === '') {
    return 'unknown'
  }

  const browser =
    /(Firefox)\/(\d+)/.exec(userAgent) ??
    /(Edg)\/(\d+)/.exec(userAgent) ??
    /(Chrome)\/(\d+)/.exec(userAgent) ??
    /(Version)\/(\d+).*Safari/.exec(userAgent)

  const platform = /Windows/.test(userAgent)
    ? 'Windows'
    : /Mac OS X/.test(userAgent)
      ? 'macOS'
      : /Linux/.test(userAgent)
        ? 'Linux'
        : 'unknown platform'

  if (browser === null) {
    return platform
  }

  const name = browser[1] === 'Version' ? 'Safari' : browser[1] === 'Edg' ? 'Edge' : browser[1]

  return `${name} ${browser[2]} / ${platform}`
}

/** Counts and a theme name. Never a value from inside the document — see the note above. */
const describeDocument = (document: ErrorReportInput['document']): string => {
  if (document === undefined || document === null) {
    return 'not available'
  }

  const count = Object.keys(document.nodes).length

  // The theme's id, which is a preset name like `midnight` — not the palette it resolved to.
  return `${count} node${count === 1 ? '' : 's'}, theme ${document.theme.id}`
}

export function formatErrorReport(input: ErrorReportInput): string {
  const command = lastOf('command')
  const gesture = lastOf('gesture')

  const lines = [
    `Motion Studio ${input.appVersion}`,
    errorLine(input.error),
    input.code === undefined ? null : `Code: ${input.code}`,
    input.blockId === undefined ? null : `Block: ${input.blockId}`,
    input.nodeId === undefined ? null : `Node: ${input.nodeId}`,
    `Action: ${command === null ? 'none recorded' : command.label}`,
    `Gesture: ${gesture === null ? 'none recorded' : gesture.label}`,
    `Browser: ${describeBrowser(input.userAgent)}`,
    `Document: ${describeDocument(input.document)}`,
    '',
    stackOf(input.error),
  ]

  return lines.filter((line) => line !== null).join('\n')
}
