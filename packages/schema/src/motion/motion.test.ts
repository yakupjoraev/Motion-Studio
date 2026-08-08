import { describe, expect, expectTypeOf, it } from 'vitest'
import type { z } from 'zod'

import { type motionChannelSchema, motionSpecSchema, motionTriggerSchema } from './motion.schema'
import type { MotionChannel, MotionSpec, MotionTrigger, MotionTriggerKind } from './motion.types'

const spec = (overrides: Partial<MotionSpec> = {}): unknown => ({
  presetId: 'fade-up',
  channel: 'entrance',
  trigger: { kind: 'mount' },
  params: { distance: 32 },
  ...overrides,
})

describe('the schema and the type describe the same thing', () => {
  it('agrees on the channels', () => {
    expectTypeOf<z.infer<typeof motionChannelSchema>>().toEqualTypeOf<MotionChannel>()
  })

  it('agrees on the trigger union', () => {
    // One direction only: the schema's output is mutable and the document type is `readonly`, so
    // "assignable to" is the strongest statement that is true of both.
    expectTypeOf<z.infer<typeof motionTriggerSchema>>().toMatchTypeOf<MotionTrigger>()
  })

  it('lists every trigger kind in the union', () => {
    const kinds: readonly MotionTriggerKind[] = [
      'mount',
      'inView',
      'scrollProgress',
      'hover',
      'press',
      'pointerMove',
      'always',
    ]

    for (const kind of kinds) {
      expect(motionTriggerSchema.options.some((option) => option.shape.kind.value === kind)).toBe(
        true,
      )
    }
  })
})

describe('motionSpecSchema', () => {
  it('accepts a minimal spec and defaults its params', () => {
    const parsed = motionSpecSchema.parse({
      presetId: 'fade-up',
      channel: 'entrance',
      trigger: { kind: 'mount' },
    })

    expect(parsed.params).toEqual({})
  })

  it.each([
    ['a preset id that is not kebab-case', { presetId: 'Fade Up' }],
    ['a channel outside the set', { channel: 'wobble' }],
    ['a trigger kind that does not exist', { trigger: { kind: 'blink' } }],
    [
      'an inView amount above 1',
      { trigger: { kind: 'inView', amount: 2, once: true, margin: '' } },
    ],
    ['params holding an object', { params: { curve: { x: 1 } } }],
    ['a stagger with no direction', { stagger: { each: 40 } }],
  ])('rejects %s', (_label, overrides) => {
    expect(motionSpecSchema.safeParse(spec(overrides as Partial<MotionSpec>)).success).toBe(false)
  })

  it('keeps an inView trigger whole', () => {
    const parsed = motionSpecSchema.parse(
      spec({ trigger: { kind: 'inView', amount: 0.3, once: true, margin: '-10%' } }),
    )

    expect(parsed.trigger).toEqual({ kind: 'inView', amount: 0.3, once: true, margin: '-10%' })
  })

  it('accepts a disabled spec, because the document keeps it rather than dropping it', () => {
    expect(motionSpecSchema.safeParse(spec({ disabled: true })).success).toBe(true)
  })
})
