import { type NextRequest, NextResponse } from 'next/server'

import { GEO_COUNTRY_HEADER } from './src/lib/i18n/guess-locale'
import { LOCALE_COOKIE, localeCookieValue } from './src/lib/i18n/locale-cookie'
import { resolveRequestLocale } from './src/lib/i18n/resolve-request-locale'

/**
 * The locale decision, and nothing else — ADR-361. It is here rather than in a layout because the
 * language has to pick the HTML, not arrive after it: a locale read on the client paints English and
 * swaps, which is the flash prompt 65 forbids.
 *
 * The decision itself is `resolveRequestLocale`, a pure function with its own tests. This file is
 * the seam onto Next's request and response.
 */
export function middleware(request: NextRequest): NextResponse {
  const action = resolveRequestLocale(
    {
      pathname: request.nextUrl.pathname,
      cookieLocale: localeCookieValue(request.cookies.get(LOCALE_COOKIE)?.value),
      country: request.headers.get(GEO_COUNTRY_HEADER),
      acceptLanguage: request.headers.get('accept-language'),
    },
    request.nextUrl.search,
  )

  if (action.kind === 'pass') {
    return NextResponse.next()
  }

  const url = new URL(action.to, request.url)

  return action.kind === 'rewrite' ? NextResponse.rewrite(url) : NextResponse.redirect(url)
}

export const config = {
  /*
   * Everything a person can see, and nothing a machine fetches: `_next` is the build output, `api`
   * answers in one language (JSON), and a path with a dot is a file in `public/`. A locale prefix on
   * any of them would be a redirect on the critical path for no visible difference.
   */
  matcher: ['/((?!_next|api|.*\\.).*)'],
}
