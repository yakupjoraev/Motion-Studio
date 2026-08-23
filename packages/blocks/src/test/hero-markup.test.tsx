import { describe, expect, it } from 'vitest'

import { HeroAction } from '../hero/hero-action'
import { heroActionMarkup } from '../hero/hero-action.markup'
import { HeroCopy } from '../hero/hero-copy'
import { heroCopyMarkup } from '../hero/hero-copy.markup'
import { HeroEyebrow } from '../hero/hero-eyebrow'
import { heroEyebrowMarkup } from '../hero/hero-eyebrow.markup'
import { HeroTrustRow } from '../hero/hero-trust-row'
import { heroTrustRowMarkup } from '../hero/hero-trust-row.markup'

import { expectParity } from './expect-parity'

const cta = { label: 'Get started', href: '/start', variant: 'primary' } as const

describe('the pieces of the copy column', () => {
  it('matches HeroEyebrow as a pill', () => {
    expectParity(
      heroEyebrowMarkup({ text: 'New', eyebrowStyle: 'pill' }),
      <HeroEyebrow eyebrowStyle="pill" text="New" />,
    )
  })

  it('matches HeroEyebrow as plain text', () => {
    expectParity(
      heroEyebrowMarkup({ text: 'New', eyebrowStyle: 'plain' }),
      <HeroEyebrow eyebrowStyle="plain" text="New" />,
    )
  })

  it('renders no eyebrow for empty text', () => {
    expect(heroEyebrowMarkup({ text: '', eyebrowStyle: 'pill' })).toBeNull()
  })

  it('matches a HeroAction link and a HeroAction button', () => {
    const button = { ...cta, href: '' }

    expectParity(heroActionMarkup(cta), <HeroAction action={cta} />)
    expectParity(heroActionMarkup(button), <HeroAction action={button} />)
  })

  it('matches a HeroTrustRow', () => {
    const items = [{ label: 'No credit card' }, { label: '4.9 average' }]

    expectParity(
      heroTrustRowMarkup({ items, align: 'center' }),
      <HeroTrustRow align="center" items={items} />,
    )
  })

  it('renders no trust row without items', () => {
    expect(heroTrustRowMarkup({ items: [], align: 'start' })).toBeNull()
  })
})

describe('the copy column all six heroes share', () => {
  const copy = {
    eyebrow: 'Now in beta',
    eyebrowStyle: 'pill',
    headline: 'Design in motion',
    subtitle: 'The subtitle that sits under it.',
    actions: [cta, { label: 'Read the docs', href: '', variant: 'secondary' }],
    trust: [{ label: 'No credit card' }],
    align: 'start',
  } as const

  it('matches the whole column', () => {
    expectParity(heroCopyMarkup(copy), <HeroCopy {...copy} />)
  })

  it('matches the column a split hero asks for', () => {
    const split = { ...copy, headlineSize: 'display-2', subtitleSize: 'md' } as const

    expectParity(heroCopyMarkup(split), <HeroCopy {...split} />)
  })

  it('matches a column with nothing but a headline', () => {
    const bare = { ...copy, eyebrow: '', subtitle: '', actions: [], trust: [] }

    expectParity(heroCopyMarkup(bare), <HeroCopy {...bare} />)
  })
})
