// `/registry` and not the barrel: ADR-107 keeps React out of this module's graph, and a sitemap that
// imported the components would pull every client block into a server-only route.
import { blockRegistry } from '@motion-studio/blocks/registry'
import type { MetadataRoute } from 'next'

import { INDEX_FILE, readDocs } from '../src/lib/docs/read-docs'
import { localeHref } from '../src/lib/i18n/locale-href'
import { LOCALES } from '../src/lib/i18n/locales'
import { absolute } from '../src/lib/site'

/**
 * `prompts/69` § 1, generated rather than written: a hand-kept list of 72 block pages is a list that
 * is wrong by the next commit.
 *
 * The studio and the playground are absent for the same reason `robots.ts` disallows them — they are
 * applications, not pages. The Uiverse catalogue is absent too, and that is a different reason: its
 * 3 802 elements are **somebody else's** content (ADR-398), and asking a search engine to index a
 * copy of another site's library is how a mirror gets treated as one.
 *
 * Every entry carries `alternates.languages`, so the two locales are declared as translations of one
 * page rather than as two pages that happen to say the same thing.
 */
const routes = (): readonly string[] => [
  '/',
  '/blocks',
  '/docs',
  '/privacy',
  '/terms',
  ...blockRegistry.list().map((definition) => `/blocks/${definition.id}`),
  ...readDocs()
    .filter((entry) => entry.fileName !== INDEX_FILE)
    .map((entry) => `/docs/${entry.slug}`),
]

/** The landing changes with the product; a block page changes when its definition does. */
const priorityOf = (path: string): number => {
  if (path === '/') {
    return 1
  }

  return path === '/blocks' || path === '/docs' ? 0.8 : 0.6
}

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  return routes().flatMap((path) =>
    LOCALES.map((locale) => ({
      url: absolute(localeHref(locale, path)),
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: priorityOf(path),
      alternates: {
        languages: Object.fromEntries(
          LOCALES.map((other) => [other, absolute(localeHref(other, path))]),
        ),
      },
    })),
  )
}
