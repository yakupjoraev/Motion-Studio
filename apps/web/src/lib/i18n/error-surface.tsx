'use client'

import { createDictionaryContext } from './create-dictionary-context'
import type { Dictionary } from './dictionary'

/**
 * The error boundaries' own strings, in their own context.
 *
 * Separate from every other surface because of where they render: a boundary catches a throw from
 * inside a route, and it has to be able to say so on a page whose own providers may be the thing
 * that failed. One small context, provided high, is the shape that survives that.
 */
const errorContext = createDictionaryContext<Dictionary['errors']>('errors')

export const ErrorDictionary = errorContext.Provider
export const useErrors = errorContext.use
