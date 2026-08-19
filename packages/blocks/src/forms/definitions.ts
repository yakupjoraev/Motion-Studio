import { checkboxFieldDefinition } from './checkbox-field/checkbox-field.definition'
import { contactFormDefinition } from './contact-form/contact-form.definition'
import { inputFieldDefinition } from './input-field/input-field.definition'
import { selectFieldDefinition } from './select-field/select-field.definition'
import { waitlistFormDefinition } from './waitlist-form/waitlist-form.definition'

// COMPONENT_LIBRARY.md § Catalogue (Forms), which is the order the palette groups them in.
export const definitions = {
  'input-field': inputFieldDefinition,
  'select-field': selectFieldDefinition,
  'checkbox-field': checkboxFieldDefinition,
  'contact-form': contactFormDefinition,
  'waitlist-form': waitlistFormDefinition,
} as const
