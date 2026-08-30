import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import { describeProps } from './describe-props'
import type { BlockDefinition } from './registry.types'

const definition = (
  schema: z.ZodTypeAny,
  defaults: Record<string, unknown>,
  controls: BlockDefinition['controls'] = [],
): BlockDefinition =>
  ({
    id: 'test-block',
    name: 'Test',
    description: '',
    category: 'layout',
    tags: [],
    icon: 'card',
    propsSchema: schema,
    defaults,
    previewProps: defaults,
    slots: [],
    controls,
    capabilities: {
      resizable: false,
      fullWidth: false,
      requiresBackdrop: false,
      supportsMotion: [],
      costClass: 'cheap',
    },
    defaultMotion: {},
    codegen: { tag: 'div' },
    a11y: { notes: [] },
  }) as unknown as BlockDefinition

describe('describing a block’s props from its schema', () => {
  it('names every key the schema declares, and no others', () => {
    const rows = describeProps(
      definition(z.object({ a: z.string(), b: z.number() }), { a: 'x', b: 1 }),
    )

    expect(rows.map((row) => row.name)).toEqual(['a', 'b'])
  })

  it('writes an enum the way a signature would', () => {
    const rows = describeProps(
      definition(z.object({ tint: z.enum(['accent', 'info']).default('accent') }), {
        tint: 'accent',
      }),
    )

    expect(rows[0]?.type).toBe("'accent' | 'info'")
  })

  it('carries a number’s bounds, because a bounded prop is a different prop', () => {
    const rows = describeProps(
      definition(z.object({ blur: z.number().min(24).max(160).default(80) }), { blur: 80 }),
    )

    expect(rows[0]?.type).toBe('number (24…160)')
    expect(rows[0]?.defaultValue).toBe('80')
  })

  it('sees through a default and an optional to the type underneath', () => {
    const rows = describeProps(
      definition(z.object({ label: z.string().optional(), on: z.boolean().default(true) }), {
        on: true,
      }),
    )

    expect(rows.map((row) => row.type)).toEqual(['string', 'boolean'])
  })

  it('marks a prop the schema gives no default as required', () => {
    const rows = describeProps(definition(z.object({ src: z.string() }), {}))

    expect(rows[0]?.defaultValue).toBe('—')
  })

  it('takes its description and its responsive flag from the control that edits the prop', () => {
    const rows = describeProps(
      definition(z.object({ gap: z.number().default(4) }), { gap: 4 }, [
        {
          id: 'layout',
          label: 'Layout',
          controls: [
            {
              path: 'gap',
              kind: 'slider',
              label: 'Gap',
              hint: 'Space between children',
              responsive: true,
            },
          ],
        },
      ]),
    )

    expect(rows[0]?.description).toBe('Space between children')
    expect(rows[0]?.responsive).toBe(true)
  })

  it('leaves the description empty rather than inventing one', () => {
    const rows = describeProps(definition(z.object({ gap: z.number().default(4) }), { gap: 4 }))

    expect(rows[0]?.description).toBe('')
  })

  it('describes an array by its element type', () => {
    const rows = describeProps(
      definition(z.object({ items: z.array(z.string()).default([]) }), { items: [] }),
    )

    expect(rows[0]?.type).toBe('string[]')
  })
})
