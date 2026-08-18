import { z } from 'zod'

import { LABEL_MAX_LENGTH, iconNameField, interactiveFrameFields } from '../interactive.schema'

export const MAX_COMMANDS = 8
export const MIN_COMMANDS = 2
export const HINT_MAX_LENGTH = 16
export const GROUP_MAX_LENGTH = 24
export const ALT_MAX_LENGTH = 240

export const commandSchema = z.object({
  label: z.string().min(1).max(LABEL_MAX_LENGTH).default('Insert block'),
  icon: iconNameField,
  /** The shortcut beside the row, drawn as keycaps. Empty means the row shows none. */
  hint: z.string().max(HINT_MAX_LENGTH).default(''),
  /** The heading this row sits under. Consecutive rows sharing a group are drawn under one heading. */
  group: z.string().max(GROUP_MAX_LENGTH).default(''),
})

export type Command = z.infer<typeof commandSchema>

export const commandMenuPreviewSchema = z.object({
  placeholder: z.string().min(1).max(LABEL_MAX_LENGTH).default('Search commands…'),
  commands: z
    .array(commandSchema)
    .min(MIN_COMMANDS)
    .max(MAX_COMMANDS)
    .default([
      { label: 'Insert block', icon: 'plus', hint: 'B', group: 'Editor' },
      { label: 'Toggle layers', icon: 'layout-rows', hint: '⌥L', group: 'Editor' },
      { label: 'Play motion', icon: 'play', hint: 'Space', group: 'Motion' },
      { label: 'Edit curve', icon: 'curve', hint: '', group: 'Motion' },
      { label: 'Export project', icon: 'export', hint: '⌘E', group: 'Project' },
      { label: 'Theme builder', icon: 'palette', hint: '⌘T', group: 'Project' },
    ]),
  /**
   * The text alternative, and it is required. This block is a **picture** of a command palette: the visual is
   * `aria-hidden`, so without this a screen reader would meet nothing at all where the page shows a whole panel.
   */
  alt: z
    .string()
    .min(1)
    .max(ALT_MAX_LENGTH)
    .default('A command palette listing editor, motion and project commands with their shortcuts.'),
  glass: z.boolean().default(false),
  ...interactiveFrameFields(),
})

export type CommandMenuPreviewProps = z.infer<typeof commandMenuPreviewSchema>

export interface CommandGroup {
  readonly label: string
  readonly commands: readonly Command[]
}

/**
 * Consecutive rows with the same `group` become one section, so the grouping is the order the author put the
 * rows in rather than a second field to keep in sync. Rows with no group land in an unlabelled section, which
 * is what a palette with no headings looks like.
 */
export function groupCommands(commands: readonly Command[]): readonly CommandGroup[] {
  const groups: { label: string; commands: Command[] }[] = []

  for (const command of commands) {
    const last = groups[groups.length - 1]

    if (last !== undefined && last.label === command.group) {
      last.commands.push(command)
    } else {
      groups.push({ label: command.group, commands: [command] })
    }
  }

  return groups
}
