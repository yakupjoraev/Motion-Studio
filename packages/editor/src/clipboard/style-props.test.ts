import { type BlockRegistry, fakeRegistry, fixtureBlockId, node } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'
import { z } from 'zod'

import {
  STYLE_GROUP_IDS,
  acceptsStyleProp,
  applicableStyleProps,
  collectStyleProps,
} from './style-props'

const cardSchema = z.object({
  title: z.string().default(''),
  glass: z.boolean().default(false),
  padding: z.object({ top: z.number() }).default({ top: 0 }),
  font: z.string().default('inter'),
})

/** A block with the four inspector groups, and one with only content — the paste-style pair. */
const registry: BlockRegistry = fakeRegistry({
  card: {
    propsSchema: cardSchema,
    defaults: { title: '', glass: false, padding: { top: 0 }, font: 'inter' },
    controls: [
      {
        id: 'layout',
        label: 'Layout',
        controls: [{ path: 'columns', kind: 'stepper', label: 'Columns' }],
      },
      {
        id: 'style',
        label: 'Style',
        controls: [
          { path: 'glass', kind: 'switch', label: 'Glass' },
          { path: 'padding.top', kind: 'number', label: 'Top' },
        ],
      },
      {
        id: 'typography',
        label: 'Type',
        controls: [{ path: 'font', kind: 'font', label: 'Font' }],
      },
      {
        id: 'content',
        label: 'Content',
        controls: [{ path: 'title', kind: 'text', label: 'Title' }],
      },
    ],
  },
  plain: {
    propsSchema: z.object({ title: z.string().default('') }),
    defaults: { title: '' },
    controls: [
      {
        id: 'content',
        label: 'Content',
        controls: [{ path: 'title', kind: 'text', label: 'Title' }],
      },
    ],
  },
})

const card = registry.require(fixtureBlockId('card'))
const plain = registry.require(fixtureBlockId('plain'))

const styled = (): ReturnType<typeof node> =>
  node({
    blockId: fixtureBlockId('card'),
    props: { title: 'Pricing', glass: true, padding: { top: 24 }, font: 'satoshi' },
  })

describe('style props', () => {
  it('names the three style groups', () => {
    expect(STYLE_GROUP_IDS).toEqual(['style', 'effects', 'typography'])
  })

  it('collects the style and typography controls, not layout or content', () => {
    expect(collectStyleProps(card, styled())).toEqual({
      glass: true,
      'padding.top': 24,
      font: 'satoshi',
    })
  })

  it('skips a style control the node has not set', () => {
    const bare = node({ blockId: fixtureBlockId('card'), props: { glass: true } })

    expect(collectStyleProps(card, bare)).toEqual({ glass: true })
  })

  it('accepts a prop the target block keeps', () => {
    expect(acceptsStyleProp(card, { title: 'Other' }, 'glass', true)).toBe(true)
  })

  it('rejects a prop the target block strips', () => {
    expect(acceptsStyleProp(plain, { title: 'Other' }, 'glass', true)).toBe(false)
  })

  it('rejects a value the target schema will not take', () => {
    expect(acceptsStyleProp(card, { title: 'Other' }, 'glass', 'yes')).toBe(false)
  })

  it('does not write through into the props it was handed', () => {
    const props = { title: 'Other', padding: { top: 0 } }

    acceptsStyleProp(card, props, 'padding.top', 40)

    expect(props.padding.top).toBe(0)
  })

  it('filters a style payload down to what the target holds', () => {
    const style = collectStyleProps(card, styled())

    expect(applicableStyleProps(plain, { title: 'Other' }, style)).toEqual({})
    expect(applicableStyleProps(card, { title: 'Other' }, style)).toEqual(style)
  })
})
