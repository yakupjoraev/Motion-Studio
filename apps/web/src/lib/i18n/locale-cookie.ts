import { type Locale, isLocale } from './locales'

/**
 * ADR-362. The choice has to be readable before the HTML is chosen, so it is a cookie and not
 * `localStorage`. Middleware reads it and never writes it: only an explicit choice writes, which is
 * what stops the guess from running a second time and undoing it.
 */
export const LOCALE_COOKIE = 'ms-locale'

/** A year. A language preference that expires in a session is not a preference. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365

export const localeCookieValue = (raw: string | undefined): Locale | undefined =>
  isLocale(raw) ? raw : undefined

/**
 * Written from the client, because the switch is a client component and a round trip to write a
 * preference the browser already knows would be a request nobody is waiting for.
 *
 * Not `HttpOnly` for that reason, and `SameSite=Lax` so a link from elsewhere still arrives in the
 * language the visitor chose.
 */
export const localeCookieHeader = (locale: Locale): string =>
  `${LOCALE_COOKIE}=${locale}; Path=/; Max-Age=${LOCALE_COOKIE_MAX_AGE}; SameSite=Lax`

export const readLocaleCookie = (cookieHeader: string | null | undefined): Locale | undefined => {
  if (!cookieHeader) {
    return undefined
  }

  for (const part of cookieHeader.split(';')) {
    const [name, ...rest] = part.trim().split('=')

    if (name === LOCALE_COOKIE) {
      return localeCookieValue(rest.join('='))
    }
  }

  return undefined
}
