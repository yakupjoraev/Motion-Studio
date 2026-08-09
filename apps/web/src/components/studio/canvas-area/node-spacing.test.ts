import { SPACE_PX } from '@motion-studio/blocks'
import { describe, expect, it } from 'vitest'

import { nodeSpacing } from './node-spacing'

describe('nodeSpacing', () => {
  it('reads the padding the document stores, in pixels', () => {
    expect(nodeSpacing({ padding: 'lg' })).toEqual({
      padding: { top: SPACE_PX.lg, right: SPACE_PX.lg, bottom: SPACE_PX.lg, left: SPACE_PX.lg },
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    })
  })

  it('has nothing to say about a block with no padding prop', () => {
    expect(nodeSpacing({ text: 'Heading' })).toBeUndefined()
  })

  it('ignores a value that is not a step of the scale', () => {
    expect(nodeSpacing({ padding: 23 })).toBeUndefined()
    expect(nodeSpacing({ padding: 'enormous' })).toBeUndefined()
  })
})
