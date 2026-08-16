import type { MotionChannel, MotionSpec } from '@motion-studio/schema'

import { contentEntrance } from '../content.motion'

/**
 * `fade-up`, not `counter`. The count-up preset is the obvious one and it is deliberately not the
 * default: the value is a *string* — `1.8s`, `−32%`, `3×` — and counting it up means guessing its
 * format. A user who wants it picks it in the motion panel, where the format is theirs to state.
 */
export const statMotion: Readonly<Partial<Record<MotionChannel, MotionSpec>>> = {
  entrance: contentEntrance('fade-up'),
}
