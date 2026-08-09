import { describe, expect, it } from 'vitest'

import { containerStyles } from './layout/container/container.styles'
import { SPACE_PX, SPACE_SCALE } from './scales'

/** Tailwind's spacing unit: `p-4` is 16 px, and that is what ties a class to `SPACE_PX`. */
const REM_STEP = 4

const paddingClass = (padding: (typeof SPACE_SCALE)[number]): string => {
  const found = containerStyles({ padding })
    .split(' ')
    .find((one) => one.startsWith('p-'))

  return found ?? ''
}

describe('SPACE_PX', () => {
  it('names a pixel value for every step of the scale', () => {
    expect(Object.keys(SPACE_PX).sort()).toEqual([...SPACE_SCALE].sort())
  })

  it('matches the padding class the container actually spends', () => {
    for (const step of SPACE_SCALE) {
      const steps = Number(paddingClass(step).replace('p-', ''))

      expect(steps * REM_STEP, step).toBe(SPACE_PX[step])
    }
  })
})
