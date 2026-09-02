'use client'

/**
 * What was happening when it broke — `prompts/58` § Error report.
 *
 * A bug report that says only "it crashed" is a bug nobody can reproduce. The two facts that turn
 * most of them into reproducible ones are the last command the store ran and the last thing the user
 * did, and neither is recoverable from a stack trace: by the time React unwinds, the gesture is over
 * and the command has already committed.
 *
 * A ring buffer rather than a log: this exists to be read once, in a report, and a session that runs
 * for an hour must not hold an hour of gestures in memory. Ten is enough to see a sequence and small
 * enough to paste.
 */
const LIMIT = 10

export type ContextKind = 'command' | 'gesture'

export interface ContextEntry {
  readonly kind: ContextKind
  readonly label: string
  /** Milliseconds since the page loaded, so an entry says how long before the failure it happened. */
  readonly at: number
}

let entries: ContextEntry[] = []

/** Monotonic where it exists, which is every browser this app supports, and a fallback for tests. */
const now = (): number =>
  typeof performance === 'undefined' ? Date.now() : Math.round(performance.now())

const record = (kind: ContextKind, label: string): void => {
  entries = [...entries.slice(-(LIMIT - 1)), { kind, label, at: now() }]
}

/** The store's own label for what it just ran — `setProp plans[2].price`, `Add Section`. */
export const recordCommand = (label: string): void => record('command', label)

/**
 * What the user did, in the app's words rather than the DOM's: `click Export`, `press Mod+z`.
 *
 * Deliberately not the event target's text or value — a report is pasted into a public issue, and a
 * gesture recorded as "typed 'my client's launch date'" is a leak wearing a diagnostic's clothes.
 */
export const recordGesture = (label: string): void => record('gesture', label)

export const contextEntries = (): readonly ContextEntry[] => entries

export const lastOf = (kind: ContextKind): ContextEntry | null =>
  [...entries].reverse().find((entry) => entry.kind === kind) ?? null

/** Test seam: a ring buffer that survives between tests would make them order-dependent. */
export const resetErrorContext = (): void => {
  entries = []
}
