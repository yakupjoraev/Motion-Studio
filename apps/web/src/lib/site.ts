import { localeHref } from './i18n/locale-href'
import { LOCALES, type Locale } from './i18n/locales'

/**
 * Where this deployment thinks it lives. One module, because a sitemap, a canonical link and an
 * Open Graph URL that disagree are three different bugs with one cause.
 *
 * The order is deliberate. `NEXT_PUBLIC_SITE_URL` is what a custom domain sets and it wins over
 * everything: until it exists the platform's own hostname is correct but temporary, and
 * `*.vercel.app` is served `X-Robots-Tag: noindex`, so no crawler reads any of this yet
 * (`prompts/69` § 1). The fallback is the production hostname rather than the per-deployment one,
 * so a preview build does not publish canonical links pointing at itself.
 */
const PRODUCTION_FALLBACK = 'https://motion-studio-y3dev.vercel.app'

const fromEnvironment = (): string | null => {
  const explicit = process.env['NEXT_PUBLIC_SITE_URL']

  if (explicit !== undefined && explicit !== '') {
    return explicit
  }

  const platform = process.env['VERCEL_PROJECT_PRODUCTION_URL']

  return platform === undefined || platform === '' ? null : `https://${platform}`
}

/** No trailing slash, so `${SITE_URL}${path}` is always right and never `//`. */
export const SITE_URL = (fromEnvironment() ?? PRODUCTION_FALLBACK).replace(/\/+$/, '')

/**
 * True once the site answers on a domain of its own. Until then the platform serves `noindex` on
 * every response whatever `robots.txt` says, so claiming to be indexable would be a lie the
 * Lighthouse SEO audit already catches.
 */
export const HAS_CUSTOM_DOMAIN = !SITE_URL.endsWith('.vercel.app')

/** An absolute URL for a path that is already locale-prefixed by `localeHref`. */
export const absolute = (path: string): string => `${SITE_URL}${path === '/' ? '' : path}`

/**
 * The `alternates` block every indexable page carries — `prompts/69` § 1.
 *
 * `canonical` names one address for the page so the two locales are not read as duplicates of each
 * other, and `languages` declares them as translations. `path` is the **unprefixed** route, the same
 * shape `localeHref` takes, so a caller cannot accidentally prefix it twice.
 */
export const alternatesFor = (
  locale: Locale,
  path: string,
): { canonical: string; languages: Record<string, string> } => ({
  canonical: absolute(localeHref(locale, path)),
  languages: Object.fromEntries(LOCALES.map((other) => [other, absolute(localeHref(other, path))])),
})
