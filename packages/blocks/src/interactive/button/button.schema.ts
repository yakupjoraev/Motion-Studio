import { z } from 'zod'

import { HREF_MAX_LENGTH } from '../../marketing/marketing.schema'
import {
  LABEL_MAX_LENGTH,
  controlSize,
  controlVariant,
  iconNameField,
  interactiveFrameFields,
} from '../interactive.schema'

export const buttonSchema = z.object({
  label: z.string().min(1).max(LABEL_MAX_LENGTH).default('Get started'),
  /**
   * An href makes it an `<a>` and an empty one makes it a `<button>`. Not cosmetic: Enter activates a link
   * and Space activates a button, and only the element tells a reader which promise they are looking at.
   */
  href: z.string().max(HREF_MAX_LENGTH).default(''),
  variant: controlVariant.default('primary'),
  size: controlSize.default('md'),
  leadingIcon: iconNameField,
  trailingIcon: iconNameField,
  loading: z.boolean().default(false),
  /** The word a screen reader hears beside the label while the control is busy. */
  loadingLabel: z.string().min(1).max(LABEL_MAX_LENGTH).default('Loading'),
  fullWidth: z.boolean().default(false),
  ...interactiveFrameFields(),
})

export type ButtonProps = z.infer<typeof buttonSchema>
