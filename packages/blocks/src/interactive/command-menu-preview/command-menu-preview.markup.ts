import { children, defineMarkup, el, literal, txt } from '@motion-studio/schema'

import { iconMarkup } from '../../markup/icon'

import { groupCommands } from './command-menu-preview.schema'
import {
  COMMAND_GROUP_HEADING,
  COMMAND_HINT,
  COMMAND_LIST,
  COMMAND_ROW_LABEL,
  COMMAND_SEARCH,
  commandPanelStyles,
  commandRootStyles,
  commandRowStyles,
} from './command-menu-preview.styles'
import type { CommandMenuPreviewProps } from './command-menu-preview.types'

export const commandMenuPreviewMarkup = defineMarkup<CommandMenuPreviewProps>(
  ({ props: { placeholder, commands, alt, glass, hidden } }) =>
    el('div', {
      classNames: [commandRootStyles({ hidden })],
      children: [
        el('p', { classNames: ['sr-only'], children: [txt(alt)] }),
        el('div', {
          classNames: [commandPanelStyles({ glass })],
          attributes: { 'aria-hidden': literal('true') },
          children: [
            el('div', {
              classNames: [COMMAND_SEARCH],
              children: children(iconMarkup({ name: 'search', size: 18 }), txt(placeholder)),
            }),
            ...groupCommands(commands).map((group, groupIndex) =>
              el('ul', {
                classNames: [COMMAND_LIST],
                children: children(
                  group.label !== '' &&
                    el('li', {
                      classNames: [COMMAND_GROUP_HEADING],
                      children: [txt(group.label)],
                    }),
                  ...group.commands.map((command, index) =>
                    el('li', {
                      classNames: [commandRowStyles({ active: groupIndex === 0 && index === 0 })],
                      children: children(
                        el('span', {
                          classNames: [COMMAND_ROW_LABEL],
                          children: children(
                            iconMarkup({ name: command.icon, size: 16 }),
                            el('span', {
                              classNames: ['truncate'],
                              children: [txt(command.label)],
                            }),
                          ),
                        }),
                        command.hint !== '' &&
                          el('kbd', { classNames: [COMMAND_HINT], children: [txt(command.hint)] }),
                      ),
                    }),
                  ),
                ),
              }),
            ),
          ],
        }),
      ],
    }),
)
