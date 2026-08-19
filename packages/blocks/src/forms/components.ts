import { CheckboxField } from './checkbox-field/checkbox-field'
import { ContactForm } from './contact-form/contact-form'
import { InputField } from './input-field/input-field'
import { SelectField } from './select-field/select-field'
import { WaitlistForm } from './waitlist-form/waitlist-form'

/**
 * Eagerly, for the reason ADR-196 measured on the navigation category and ADR-210 restated for the interactive
 * one: what these blocks add to `/studio` is their *metadata*, which the store fixes at creation and no import
 * boundary can move. `lazy` would add five Suspense skeletons and a request each for a measured nothing.
 */
export const components = {
  'input-field': InputField,
  'select-field': SelectField,
  'checkbox-field': CheckboxField,
  'contact-form': ContactForm,
  'waitlist-form': WaitlistForm,
} as const
