import { txt } from '@motion-studio/schema'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ActionButton } from '../marketing/action-button'
import { actionButtonMarkup } from '../marketing/action-button.markup'
import { MarketingSection } from '../marketing/marketing-section'
import { marketingSectionMarkup } from '../marketing/marketing-section.markup'
import { MediaFrame } from '../marketing/media-frame'
import { mediaFrameMarkup } from '../marketing/media-frame.markup'
import { SectionHeader } from '../marketing/section-header'
import { sectionHeaderMarkup } from '../marketing/section-header.markup'
import { SectionHeading } from '../marketing/section-heading'
import { sectionHeadingMarkup } from '../marketing/section-heading.markup'

import { expectParity } from './expect-parity'

const header = {
  eyebrow: 'Why us',
  heading: 'Everything in one place',
  description: 'A description that runs to the measure and no further.',
  headingLevel: 2,
  headingAlign: 'center',
} as const

describe('the section header', () => {
  it('matches SectionHeading at the level and size it was given', () => {
    expectParity(
      sectionHeadingMarkup({ level: 3, size: 'md', children: [txt('Pricing')] }),
      <SectionHeading level={3} size="md">
        Pricing
      </SectionHeading>,
    )
  })

  it('matches a SectionHeading that carries an id', () => {
    expectParity(
      sectionHeadingMarkup({ level: 2, id: 'sidebar-heading', children: [txt('Sections')] }),
      <SectionHeading id="sidebar-heading" level={2}>
        Sections
      </SectionHeading>,
    )
  })

  it('matches a full SectionHeader', () => {
    expectParity(sectionHeaderMarkup(header), <SectionHeader {...header} />)
  })

  it('matches a SectionHeader with only a heading', () => {
    const heading = { ...header, eyebrow: '', description: '' }

    expectParity(sectionHeaderMarkup(heading), <SectionHeader {...heading} />)
  })

  it('renders nothing when all three lines are cleared, as the component does', () => {
    const empty = { ...header, eyebrow: '', heading: '', description: '' }

    expect(sectionHeaderMarkup(empty)).toBeNull()
    expect(render(<SectionHeader {...empty} />).container.firstElementChild).toBeNull()
  })
})

describe('the marketing band', () => {
  it('matches MarketingSection with its header', () => {
    expectParity(
      marketingSectionMarkup({ copy: header, hidden: false, children: [txt('content')] }),
      <MarketingSection copy={header} hidden={false} testId="marketing-section">
        content
      </MarketingSection>,
    )
  })

  it('matches MarketingSection with no header and the wide measure', () => {
    const copy = { ...header, eyebrow: '', heading: '', description: '' }

    expectParity(
      marketingSectionMarkup({
        copy,
        hidden: false,
        padding: 'compact',
        wide: true,
        children: [txt('content')],
      }),
      <MarketingSection copy={copy} hidden={false} padding="compact" testId="cta" wide>
        content
      </MarketingSection>,
    )
  })
})

describe('the action and the plate', () => {
  const action = { label: 'Start free', href: '/signup', variant: 'primary' } as const

  it('matches an ActionButton link', () => {
    expectParity(actionButtonMarkup({ action }), <ActionButton action={action} />)
  })

  it('matches an ActionButton with no href, on the accent band', () => {
    const button = { ...action, href: '' }

    expectParity(
      actionButtonMarkup({ action: button, onAccent: true }),
      <ActionButton action={button} onAccent />,
    )
  })

  const media = {
    src: 'https://example.com/shot.png',
    alt: 'The editor',
    width: 1600,
    height: 1000,
    sizes: '(min-width: 1024px) 50vw, 100vw',
  }

  it('matches a MediaFrame holding an image', () => {
    expectParity(
      mediaFrameMarkup({ media, aspect: 'portrait', priority: true }),
      <MediaFrame aspect="portrait" media={media} priority />,
    )
  })

  it('matches an empty MediaFrame', () => {
    const empty = { ...media, src: '' }

    expectParity(mediaFrameMarkup({ media: empty }), <MediaFrame media={empty} />)
  })
})
