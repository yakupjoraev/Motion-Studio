'use client'

import { createDictionaryContext } from './create-dictionary-context'
import type { Dictionary } from './dictionary'

/**
 * The surfaces a client component can read strings from. Each one is provided by the route that
 * owns it, so a page's payload carries its own strings and nobody else's — see
 * `create-dictionary-context.tsx` for why that matters.
 */
const navContext = createDictionaryContext<Dictionary['nav']>('nav')
const landingContext = createDictionaryContext<Dictionary['landing']>('landing')

export const NavDictionary = navContext.Provider
export const useNav = navContext.use

export const LandingDictionary = landingContext.Provider
export const useLanding = landingContext.use
