import { SearchIcon } from '@motion-studio/icons'

import { ControlIcon } from '../control-icon'

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

/**
 * A picture of a command palette, for a landing page. **Deliberately non-functional**: nothing here is a
 * `<button>`, nothing takes focus, and there is no input to type into.
 *
 * That is why the whole panel is `aria-hidden` and carries a text alternative beside it. A fake widget a screen
 * reader announces as real is worse than a picture: it promises a combobox with a listbox of options, and a
 * reader who tries to use it finds a decorative `div` that does nothing. Announced as one sentence of prose, it
 * is honest — the page is showing what the product looks like.
 *
 * The same reasoning is why it needs no `'use client'`: there is no state and no handler in it, at any prop set.
 */
export function CommandMenuPreview({
  placeholder,
  commands,
  alt,
  glass,
  hidden,
}: CommandMenuPreviewProps) {
  const groups = groupCommands(commands)

  return (
    <div className={commandRootStyles({ hidden })} data-testid="command-menu-preview">
      <p className="sr-only" data-testid="command-menu-alt">
        {alt}
      </p>

      <div aria-hidden="true" className={commandPanelStyles({ glass })} data-testid="command-panel">
        <div className={COMMAND_SEARCH}>
          <SearchIcon aria-hidden="true" size={18} />
          {placeholder}
        </div>

        {groups.map((group, groupIndex) => (
          <ul className={COMMAND_LIST} key={`${group.label}-${groupIndex}`}>
            {group.label !== '' && <li className={COMMAND_GROUP_HEADING}>{group.label}</li>}

            {group.commands.map((command, index) => (
              <li
                className={commandRowStyles({ active: groupIndex === 0 && index === 0 })}
                data-testid="command-row"
                key={`${command.label}-${index}`}
              >
                <span className={COMMAND_ROW_LABEL}>
                  <ControlIcon name={command.icon} size={16} />
                  <span className="truncate">{command.label}</span>
                </span>
                {command.hint !== '' && <kbd className={COMMAND_HINT}>{command.hint}</kbd>}
              </li>
            ))}
          </ul>
        ))}
      </div>
    </div>
  )
}
