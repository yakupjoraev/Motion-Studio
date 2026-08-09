import type { Alignment } from '../scales'

import type { Cta, EyebrowStyle, TrustItem } from './hero.schema'

/**
 * The shared copy component's props. It takes values rather than a block's whole prop object, so a
 * hero can pass its own fields under whatever names its schema gave them.
 */
export interface HeroCopyProps {
  readonly eyebrow: string
  readonly eyebrowStyle: EyebrowStyle
  readonly headline: string
  readonly subtitle: string
  readonly actions: readonly Cta[]
  readonly trust?: readonly TrustItem[]
  readonly align: Alignment
  /** A hero whose text shares the band with media reads better one step down. */
  readonly subtitleSize?: 'md' | 'lg'
  /** `display-1` owns the full measure; `display-2` is the step for a column. */
  readonly headlineSize?: 'display-1' | 'display-2'
}
