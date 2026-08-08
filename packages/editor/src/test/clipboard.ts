import {
  type BlockRegistry,
  type MotionDocument,
  doc,
  fakeRegistry,
  fixtureBlockId,
  node,
} from '@motion-studio/schema'
import { z } from 'zod'

import { type Harness, harness, id } from './harness'

/** A card with one style control and one content control — the pair paste-style is measured on. */
export const cardSchema = z.object({
  title: z.string().default(''),
  glass: z.boolean().default(false),
})

export const clipboardRegistry = (): BlockRegistry =>
  fakeRegistry({
    container: {
      slots: [
        { name: 'children', label: 'Children', accepts: '*', minChildren: 0, maxChildren: null },
      ],
    },
    card: {
      propsSchema: cardSchema,
      defaults: { title: '', glass: false },
      slots: [],
      controls: [
        {
          id: 'style',
          label: 'Style',
          controls: [{ path: 'glass', kind: 'switch', label: 'Glass' }],
        },
        {
          id: 'content',
          label: 'Content',
          controls: [{ path: 'title', kind: 'text', label: 'Title' }],
        },
      ],
    },
  })

/** A clipboard that keeps its text, which is what makes the cross-store test a real round trip. */
export interface FakeSystemClipboard {
  writeText(value: string): Promise<void>
  readText(): Promise<string>
  value(): string
}

export const fakeSystemClipboard = (): FakeSystemClipboard => {
  let text = ''

  return {
    writeText: async (value: string): Promise<void> => {
      text = value
    },
    readText: async (): Promise<string> => text,
    value: (): string => text,
  }
}

/** Two cards under the root, one with a style set and one without. */
export const cards = (): MotionDocument =>
  doc([
    node({ id: id('root'), slot: 'root', children: [id('a'), id('b')] }),
    node({
      id: id('a'),
      blockId: fixtureBlockId('card'),
      parentId: id('root'),
      slot: 'children',
      props: { title: 'Starter', glass: true },
    }),
    node({
      id: id('b'),
      blockId: fixtureBlockId('card'),
      parentId: id('root'),
      slot: 'children',
      props: { title: 'Pro', glass: false },
    }),
  ])

export const studio = (document: MotionDocument = cards()): Harness =>
  harness({ registry: clipboardRegistry(), document })
