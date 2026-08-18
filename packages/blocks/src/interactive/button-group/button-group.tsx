'use client'

import * as RadioGroup from '@radix-ui/react-radio-group'
import * as ToggleGroup from '@radix-ui/react-toggle-group'
import type { ReactNode } from 'react'

import { ControlIcon } from '../control-icon'
import { ICON_SIZE } from '../interactive.styles'

import { groupItemValue, multipleDefault, singleDefault } from './button-group.schema'
import { groupItemStyles, groupRootStyles } from './button-group.styles'
import type { ButtonGroupProps } from './button-group.types'

/**
 * A segmented control: one tab stop, the arrow keys between the choices.
 *
 * **Two primitives, one per mode**, and that is ADR-208 rather than an accident. Single selection is a
 * `radiogroup`, and the ARIA radio pattern says the arrow keys *check* the choice they move to — Radix
 * Toggle Group's roving focus moves without checking, so single selection uses Radio Group, which does
 * both in one step. Multiple selection is a `toolbar` of pressed buttons, where arrows must **not** select
 * because selecting is the separate action, and Toggle Group is exactly that.
 *
 * Either way the selection is **uncontrolled**: the primitive holds it, this component holds nothing, and
 * editing the label of choice 3 in the inspector therefore cannot reset it.
 */
export function ButtonGroup({
  items,
  mode,
  look,
  size,
  defaultSelected,
  ariaLabel,
  hidden,
}: ButtonGroupProps) {
  const className = groupRootStyles({ look, hidden })
  const itemClassName = groupItemStyles({ look, size })
  const glyph = ICON_SIZE[size]

  const label = (item: { readonly label: string; readonly icon: string }): ReactNode => (
    <>
      <ControlIcon name={item.icon} size={glyph} />
      <span className="truncate">{item.label}</span>
    </>
  )

  if (mode === 'multiple') {
    return (
      <ToggleGroup.Root
        aria-label={ariaLabel}
        className={className}
        data-testid="button-group"
        defaultValue={[...multipleDefault(defaultSelected, items.length)]}
        type="multiple"
      >
        {items.map((item, index) => (
          <ToggleGroup.Item
            className={itemClassName}
            data-testid="button-group-item"
            key={`${item.label}-${index}`}
            value={groupItemValue(index)}
          >
            {label(item)}
          </ToggleGroup.Item>
        ))}
      </ToggleGroup.Root>
    )
  }

  const initial = singleDefault(defaultSelected, items.length)

  return (
    <RadioGroup.Root
      aria-label={ariaLabel}
      className={className}
      data-testid="button-group"
      loop
      orientation="horizontal"
      {...(initial === undefined ? {} : { defaultValue: initial })}
    >
      {items.map((item, index) => (
        <RadioGroup.Item
          className={itemClassName}
          data-testid="button-group-item"
          key={`${item.label}-${index}`}
          value={groupItemValue(index)}
        >
          {label(item)}
        </RadioGroup.Item>
      ))}
    </RadioGroup.Root>
  )
}
