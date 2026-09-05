'use client'

import { createDictionaryContext } from './create-dictionary-context'
import type { Dictionary } from './dictionary'

/** The playground's strings, in their own context — the route provides them, nothing else reads them. */
const playgroundContext = createDictionaryContext<Dictionary['playground']>('playground')

export const PlaygroundDictionary = playgroundContext.Provider
export const usePlayground = playgroundContext.use
