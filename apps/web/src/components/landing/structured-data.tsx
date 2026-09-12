import { SITE_URL, absolute } from '../../lib/site'

export interface StructuredDataProps {
  readonly name: string
  readonly description: string
  /** The locale-prefixed path of the page carrying the markup, so the entity has one address. */
  readonly path: string
}

/**
 * `SoftwareApplication`, with the properties that are actually true — `prompts/69` § 1.
 *
 * `offers` at price zero is not decoration: without it a search engine has no statement about cost,
 * and "free" is the single most useful fact about this product in a result list. `browserRequirements`
 * says desktop plainly, because the studio refuses to pretend below 1024 px (ADR-050) and a visitor
 * arriving on a phone from a search result should not be the one to discover that.
 *
 * Rendered as a script tag rather than through `metadata`: Next has no typed slot for JSON-LD, and
 * the object is the document's own claim about itself rather than a head field.
 */
export function StructuredData({ name, description, path }: StructuredDataProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    description,
    url: absolute(path),
    applicationCategory: 'DeveloperApplication',
    applicationSubCategory: 'Visual editor',
    operatingSystem: 'Web browser',
    browserRequirements: 'Requires JavaScript and a desktop-width viewport',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    isAccessibleForFree: true,
    author: { '@type': 'Person', name: 'Yakup Jorayev' },
    sameAs: ['https://github.com/yakupjoraev/Motion-Studio'],
    softwareHelp: { '@type': 'CreativeWork', url: `${SITE_URL}/docs` },
  }

  return (
    <script
      // biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD is a script body by specification, and every value here is this project's own copy rather than user input
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
      type="application/ld+json"
    />
  )
}
