import { cn } from '@motion-studio/utils'
import * as RadixSwitch from '@radix-ui/react-switch'
import { forwardRef } from 'react'

import { switchRootStyles, switchThumbStyles, switchTrackStyles } from './switch.styles'

import type { SwitchProps } from './switch.types'

/**
 * Radix Switch with our track and thumb. Radix owns `role="switch"`, `aria-checked`, the Space/Enter
 * keyboard path and the hidden form input; this file owns the sizes, the tokens and the timing.
 *
 * The track is a separate element rather than the root's own background because the root is the 24 × 24 hit
 * target and the track is the 24 × 14 glyph inside it (ADR-030). The extra span is the difference between
 * those two numbers, made visible.
 */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { checked, defaultChecked, onCheckedChange, className, ...rest },
  ref,
) {
  // `exactOptionalPropertyTypes`: an absent prop is omitted, never passed as `undefined`. Passing the second
  // to Radix is what turns a controlled component into an uncontrolled one by accident.
  const stateProps = {
    ...(checked === undefined ? {} : { checked }),
    ...(defaultChecked === undefined ? {} : { defaultChecked }),
    ...(onCheckedChange === undefined ? {} : { onCheckedChange }),
  }

  return (
    <RadixSwitch.Root
      ref={ref}
      className={cn(switchRootStyles(), className)}
      {...stateProps}
      {...rest}
    >
      <span className={switchTrackStyles()}>
        <RadixSwitch.Thumb className={switchThumbStyles()} />
      </span>
    </RadixSwitch.Root>
  )
})
