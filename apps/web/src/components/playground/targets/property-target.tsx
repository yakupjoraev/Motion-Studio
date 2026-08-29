'use client'

import type { ReactElement } from 'react'

import type { PlaygroundProperty } from '../properties'

import { BackdropTarget } from './backdrop-target'
import { BackgroundTarget } from './background-target'
import { ClipPathTarget } from './clip-path-target'
import { FilterTarget } from './filter-target'
import { MaskTarget } from './mask-target'
import { ShadowTarget } from './shadow-target'
import type { TargetProps } from './target.types'
import { TransformTarget } from './transform-target'
import { TransitionTarget } from './transition-target'

/**
 * Property → its target. A table rather than a switch, so adding a sandbox is one row and the eight are
 * readable in one place — PLAYGROUND.md § Property sandboxes is the same table with a column for why.
 */
const TARGETS: Readonly<Record<PlaygroundProperty, (props: TargetProps) => ReactElement>> = {
  background: BackgroundTarget,
  'box-shadow': ShadowTarget,
  filter: FilterTarget,
  'backdrop-filter': BackdropTarget,
  'mask-image': MaskTarget,
  'clip-path': ClipPathTarget,
  transform: TransformTarget,
  transition: TransitionTarget,
}

export interface PropertyTargetProps extends TargetProps {
  readonly property: PlaygroundProperty
}

export function PropertyTarget({ property, ...rest }: PropertyTargetProps): ReactElement {
  const Target = TARGETS[property]

  /*
   * Keyed by property: a sandbox switch is a different element with a different value on it, and
   * reusing the node would leave the previous property's declaration painted on the new target.
   */
  return <Target key={property} {...rest} />
}
