import { REQUIRED_SUFFIX } from './forms.schema'
import { FIELD_REQUIRED } from './forms.styles'

/**
 * The visible half of the required marking, for the label and for the legend both.
 *
 * `aria-hidden`, because the control carries the requirement as a state and a name carrying it too would state it
 * twice — once as part of the field's name, once as the state. Sighted readers get it from here, screen-reader
 * users from the attribute, each exactly once.
 *
 * A word rather than an asterisk: an asterisk is a convention a reader has to already know, and prompt 41's
 * requirement is that the requirement is in the label *text*.
 */
export function RequiredMark() {
  return (
    <span aria-hidden="true" className={FIELD_REQUIRED} data-testid="field-required">
      {REQUIRED_SUFFIX}
    </span>
  )
}
