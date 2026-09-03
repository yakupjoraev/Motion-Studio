import type { Command } from '@motion-studio/editor'

/**
 * What a crash report is allowed to say about the command that ran last — `prompts/58` § Error report.
 *
 * **Not the command's label.** A label is written for the undo tooltip and is allowed to quote the
 * document: `renameNode` builds `Rename to <the name the user typed>`, and the batch this app sends
 * from the node boundary builds `Reset <the block's name>`. Both are the user's content, and a report
 * is pasted into a public issue.
 *
 * A command's `type` is a literal in the source (`setProp`, `insertBlock`), so it cannot carry
 * anything from the document, and a prop path is a key from the block's schema for the same reason.
 * Together they are the line the prompt asks for: `setProp plans[2].price`.
 */
const pathOf = (payload: unknown): string | null => {
  if (typeof payload !== 'object' || payload === null || !('path' in payload)) {
    return null
  }

  const { path } = payload as { path: unknown }

  return typeof path === 'string' ? path : null
}

export const describeCommand = (command: Command): string => {
  const path = pathOf(command.payload)

  return path === null ? command.type : `${command.type} ${path}`
}

/**
 * A batch says how many and of what. The batch's own label is the one the history menu shows, and it
 * is subject to the same rule as a command's.
 */
export const describeBatch = (batch: readonly Command[]): string => {
  const types = new Set(batch.map((command) => command.type))
  const [only] = [...types]

  if (only === undefined) {
    return 'batch of nothing'
  }

  return types.size === 1 ? `batch ${only} ×${batch.length}` : `batch of ${batch.length} commands`
}
