import { CheckIcon, ChevronDownIcon } from '@motion-studio/icons'
import { Z_INDEX } from '@motion-studio/tokens'
import { cn } from '@motion-studio/utils'
import * as RadixSelect from '@radix-ui/react-select'
import { forwardRef } from 'react'

import { selectContentStyles, selectItemStyles, selectTriggerStyles } from './select.styles'

import type { SelectProps } from './select.types'

/**
 * Radix Select with our field styling — `TECH_STACK.md` § Radix UI: unstyled, correct, accessible, and the
 * studio chrome's skeleton. Positioning, typeahead, and the listbox semantics are Radix's; the tokens, the
 * density and the timings are ours.
 *
 * `position="popper"` rather than the default: the inspector's selects sit in a scrolling panel, and the
 * item-aligned default reparents the list over the trigger, which reads as a jump.
 */
export const Select = forwardRef<HTMLButtonElement, SelectProps>(function Select(
  {
    value,
    defaultValue,
    onValueChange,
    options,
    placeholder = 'Select…',
    disabled = false,
    invalid = false,
    className,
    prefix,
    id,
    name,
    ...aria
  },
  ref,
) {
  /*
   * `exactOptionalPropertyTypes` is on, and Radix types these props as optional without `| undefined`. So an
   * absent prop is omitted rather than passed as `undefined` — the two are different things under that flag,
   * and passing the second is what turns a controlled component into an uncontrolled one by accident.
   */
  const rootProps = {
    ...(value === undefined ? {} : { value }),
    ...(defaultValue === undefined ? {} : { defaultValue }),
    ...(onValueChange === undefined ? {} : { onValueChange }),
    ...(name === undefined ? {} : { name }),
    disabled,
  }

  return (
    <RadixSelect.Root {...rootProps}>
      <RadixSelect.Trigger
        ref={ref}
        id={id}
        aria-invalid={invalid || undefined}
        className={cn(selectTriggerStyles({ invalid }), className)}
        {...aria}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          {prefix}
          <RadixSelect.Value placeholder={placeholder} />
        </span>
        <RadixSelect.Icon asChild>
          <ChevronDownIcon size={16} className="shrink-0 text-foreground-subtle" />
        </RadixSelect.Icon>
      </RadixSelect.Trigger>

      <RadixSelect.Portal>
        <RadixSelect.Content
          position="popper"
          sideOffset={4}
          data-ms-overlay=""
          style={{ zIndex: Z_INDEX.dropdown }}
          className={selectContentStyles()}
        >
          <RadixSelect.Viewport>
            {options.map((option) => (
              <RadixSelect.Item
                key={option.value}
                value={option.value}
                {...(option.disabled === undefined ? {} : { disabled: option.disabled })}
                className={selectItemStyles()}
              >
                <RadixSelect.ItemIndicator className="absolute left-1 flex items-center">
                  <CheckIcon size={12} />
                </RadixSelect.ItemIndicator>
                <RadixSelect.ItemText>{option.label}</RadixSelect.ItemText>
              </RadixSelect.Item>
            ))}
          </RadixSelect.Viewport>
        </RadixSelect.Content>
      </RadixSelect.Portal>
    </RadixSelect.Root>
  )
})
