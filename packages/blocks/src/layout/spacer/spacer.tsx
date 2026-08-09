import { spacerStyles } from './spacer.styles'
import type { SpacerProps } from './spacer.types'

/**
 * `aria-hidden` and nothing inside it: a spacer is a gap, and a screen reader that announced it
 * would be reading out the layout.
 */
export function Spacer({ mode, height, hidden }: SpacerProps) {
  return <div aria-hidden className={spacerStyles({ mode, height, hidden })} />
}
