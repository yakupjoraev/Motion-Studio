import { cn } from '@motion-studio/utils'
import * as RadixSwitch from '@radix-ui/react-switch'
import { forwardRef } from 'react'

import { switchRootStyles, switchThumbStyles, switchTrackStyles } from './switch.styles'

import type { SwitchProps } from './switch.types'

/** The track is its own element because the root is the hit target and the track is the glyph (ADR-030). */
export const Switch = forwardRef<HTMLButtonElement, SwitchProps>(function Switch(
  { checked, defaultChecked, onCheckedChange, className, ...rest },
  ref,
) {
  // `exactOptionalPropertyTypes`: an explicit `undefined` makes Radix treat the control as uncontrolled.
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
