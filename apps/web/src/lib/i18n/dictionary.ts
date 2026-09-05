import { en } from './dictionaries/en'
import { ru } from './dictionaries/ru'
import type { Locale } from './locales'

/**
 * The English dictionary is the shape of every other one. A locale that forgets a key does not
 * compile, which is the whole reason this is TypeScript objects and not JSON files (ADR-360).
 */
export type Dictionary = typeof en

const DICTIONARIES: Record<Locale, Dictionary> = { en, ru }

/**
 * **Server side only.** Both dictionaries are reachable from here, so importing this module into a
 * client component would ship both to the browser. Client components take the dictionary as a prop
 * from a Server Component, through `LocaleProvider` — the studio's 250 kB budget is why (ADR-360).
 */
export const getDictionary = (locale: Locale): Dictionary => DICTIONARIES[locale]
