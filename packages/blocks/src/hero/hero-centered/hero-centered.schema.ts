import { z } from 'zod'

import { surfaceToken } from '../../scales'
import { heroCopyFields, heroFrameFields, heroTrustField } from '../hero.schema'

/**
 * The contract, written first — COMPONENT_LIBRARY.md § Adding a block. Every prop carries a default,
 * so `parse({})` is the block's defaults and a node stores only what the user changed (ADR-104).
 *
 * The words are the part of a default nobody can share: a hero that ships with "Lorem ipsum" is a
 * template, and the premise of this product is that a block dropped with defaults is already a page.
 */
export const heroCenteredSchema = z.object({
  ...heroCopyFields({
    eyebrow: 'Now in public beta',
    headline: 'Design interfaces that already know how to move',
    subtitle:
      'A visual editor for React that exports the component you actually shipped — tokens, motion and all.',
    actions: [
      { label: 'Start building', href: '#', variant: 'primary' },
      { label: 'See the gallery', href: '#', variant: 'secondary' },
    ],
  }),
  trust: heroTrustField([
    { label: 'MIT licensed' },
    { label: 'No account needed' },
    { label: 'Exports real code' },
  ]),
  ...heroFrameFields({ align: 'center', minHeight: 'three-quarters' }),
  background: surfaceToken.default('transparent'),
  /** A single accent field behind the headline. Depth is what separates a hero from a paragraph. */
  glow: z.boolean().default(true),
})

export type HeroCenteredProps = z.infer<typeof heroCenteredSchema>
