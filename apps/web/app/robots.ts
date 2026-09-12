import type { MetadataRoute } from 'next'

import { SITE_URL } from '../src/lib/site'

/**
 * `prompts/69` § 1. `/studio` and `/playground` are excluded because neither is a page in the sense a
 * crawler means: both are applications whose content is the visitor's own document, and a search
 * result promising one would deliver an empty editor.
 *
 * `/fixtures` and `/api` are machine routes. They answer with JSON in no language at all.
 *
 * While the site is on `*.vercel.app` the platform serves `X-Robots-Tag: noindex` on every response
 * and this file is advice nobody asks for. It is written now so that pointing a domain at the
 * deployment is the only step left — see `src/lib/site.ts`.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/fixtures/', '/studio', '/ru/studio', '/playground', '/ru/playground'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
