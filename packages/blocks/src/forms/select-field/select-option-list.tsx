import { CheckIcon } from '@motion-studio/icons'
import * as RadixSelect from '@radix-ui/react-select'

import type { SelectOption } from './select-field.schema'
import {
  SELECT_CONTENT,
  SELECT_INDICATOR,
  SELECT_ITEM,
  SELECT_VIEWPORT,
} from './select-field.styles'

export interface SelectOptionListProps {
  readonly options: readonly SelectOption[]
}

/**
 * The list, in a portal.
 *
 * `position="popper"` so it is placed beside the trigger rather than over it, which is what lets the trigger stay
 * readable while the list is open. The tick is `aria-hidden`: Radix puts `aria-selected` on the option, and a
 * glyph announcing the same thing would say it twice.
 */
export function SelectOptionList({ options }: SelectOptionListProps) {
  return (
    <RadixSelect.Portal>
      <RadixSelect.Content
        className={SELECT_CONTENT}
        data-testid="select-content"
        position="popper"
        sideOffset={6}
      >
        <RadixSelect.Viewport className={SELECT_VIEWPORT}>
          {options.map((option) => (
            <RadixSelect.Item className={SELECT_ITEM} key={option.value} value={option.value}>
              <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
              <RadixSelect.ItemIndicator className={SELECT_INDICATOR}>
                <CheckIcon aria-hidden="true" size={14} />
              </RadixSelect.ItemIndicator>
            </RadixSelect.Item>
          ))}
        </RadixSelect.Viewport>
      </RadixSelect.Content>
    </RadixSelect.Portal>
  )
}
