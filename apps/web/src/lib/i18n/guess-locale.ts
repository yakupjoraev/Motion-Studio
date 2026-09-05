import { DEFAULT_LOCALE, type Locale } from './locales'

/**
 * ADR-363. The countries where Russian is an official or a widely used working language. The list is
 * a judgement and it is written in the ADR so it can be argued with; this constant is only where the
 * judgement is applied.
 */
export const RUSSIAN_SPEAKING_COUNTRIES: ReadonlySet<string> = new Set([
  'RU',
  'BY',
  'KZ',
  'KG',
  'TJ',
  'TM',
  'UZ',
  'AM',
  'MD',
])

/** The header Vercel sets on every request to a deployment. Absent in `next dev` and in Docker. */
export const GEO_COUNTRY_HEADER = 'x-vercel-ip-country'

/** `ru-RU,ru;q=0.9,en;q=0.8` → `ru`. Only the first tag decides; the q-list is a preference order. */
export const firstLanguageTag = (acceptLanguage: string | null | undefined): string | undefined => {
  const first = acceptLanguage?.split(',')[0]?.trim().split(';')[0]?.trim()

  return first === undefined || first === '' ? undefined : first.toLowerCase()
}

export interface LocaleSignals {
  readonly country: string | null | undefined
  readonly acceptLanguage: string | null | undefined
}

/**
 * Runs **only when there is no stored choice** — the point of the owner's specification that is
 * easiest to get wrong (ADR-362). Either signal pointing at Russian is enough: a Russian speaker
 * abroad carries it in their browser, and an English browser inside the region is one click from
 * the answer it wanted.
 */
export function guessLocale({ country, acceptLanguage }: LocaleSignals): Locale {
  if (
    country !== null &&
    country !== undefined &&
    RUSSIAN_SPEAKING_COUNTRIES.has(country.toUpperCase())
  ) {
    return 'ru'
  }

  return firstLanguageTag(acceptLanguage)?.startsWith('ru') === true ? 'ru' : DEFAULT_LOCALE
}
