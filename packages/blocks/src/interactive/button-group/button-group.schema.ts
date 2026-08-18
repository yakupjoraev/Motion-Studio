import { z } from 'zod'

import {
  LABEL_MAX_LENGTH,
  controlSize,
  iconNameField,
  labelledFrameFields,
} from '../interactive.schema'

export const MAX_GROUP_ITEMS = 5
export const MIN_GROUP_ITEMS = 2

export const GROUP_LOOKS = ['joined', 'segmented'] as const

export type GroupLook = (typeof GROUP_LOOKS)[number]

export const GROUP_MODES = ['single', 'multiple'] as const

export type GroupMode = (typeof GROUP_MODES)[number]

export const groupItemSchema = z.object({
  label: z.string().min(1).max(LABEL_MAX_LENGTH).default('Monthly'),
  icon: iconNameField,
})

export type GroupItem = z.infer<typeof groupItemSchema>

/**
 * The value Radix keys an item by. Derived from the index rather than from the label, because two items
 * called "Auto" would otherwise be one item — a document is user text and cannot be trusted to be unique.
 */
export const groupItemValue = (index: number): string => `item-${index}`

export const buttonGroupSchema = z.object({
  items: z
    .array(groupItemSchema)
    .min(MIN_GROUP_ITEMS)
    .max(MAX_GROUP_ITEMS)
    .default([
      { label: 'Monthly', icon: '' },
      { label: 'Yearly', icon: '' },
    ]),
  mode: z.enum(GROUP_MODES).default('single'),
  look: z.enum(GROUP_LOOKS).default('joined'),
  size: controlSize.default('md'),
  /**
   * Which item starts on, as an index. `-1` starts with none, which `single` allows and is what a filter
   * row wants. In `multiple` mode it is the one item that starts on — a list of indexes would be a second
   * shape for the inspector to edit for a case no default needs.
   */
  defaultSelected: z
    .number()
    .int()
    .min(-1)
    .max(MAX_GROUP_ITEMS - 1)
    .default(0),
  ...labelledFrameFields('View'),
})

export type ButtonGroupProps = z.infer<typeof buttonGroupSchema>

/** What Radix's uncontrolled root starts with: a string for `single`, an array for `multiple`. */
export const singleDefault = (index: number, count: number): string | undefined =>
  index >= 0 && index < count ? groupItemValue(index) : undefined

export const multipleDefault = (index: number, count: number): readonly string[] => {
  const value = singleDefault(index, count)

  return value === undefined ? [] : [value]
}
