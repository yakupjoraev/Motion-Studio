import { buildSearchIndex, serializeSearchIndex } from '../../src/lib/docs/build-search-index'

/**
 * Built once, at build time, and served as a static file — `force-static` is what makes `next build`
 * write it to disk rather than running this handler per request.
 *
 * It lives outside `/docs` so it cannot be shadowed by `/docs/[...slug]`, which matches any path
 * under that segment.
 */
export const dynamic = 'force-static'

export function GET(): Response {
  return new Response(serializeSearchIndex(buildSearchIndex()), {
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'public, max-age=0, must-revalidate',
    },
  })
}
