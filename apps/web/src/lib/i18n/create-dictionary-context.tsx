'use client'

import { type ReactNode, createContext, useContext } from 'react'

export interface DictionaryProviderProps<T> {
  readonly value: T
  readonly children: ReactNode
}

export interface DictionaryContext<T> {
  readonly Provider: (props: DictionaryProviderProps<T>) => ReactNode
  readonly use: () => T
}

/**
 * One context per surface, rather than one context holding every string in the product.
 *
 * The reason is measurable: a dictionary handed to a client component travels in the RSC payload of
 * the page that renders it, so a single shared provider would put the studio's strings in the
 * landing page's HTML. A surface provides its own slice, and a page carries only what its own
 * client components read.
 *
 * The generic is what keeps this honest — no cast, and a consumer of the wrong surface does not
 * compile (§ 1.1 of the contract).
 */
export function createDictionaryContext<T>(surface: string): DictionaryContext<T> {
  const Context = createContext<T | null>(null)

  return {
    Provider: ({ value, children }: DictionaryProviderProps<T>) => (
      <Context.Provider value={value}>{children}</Context.Provider>
    ),
    use: (): T => {
      const value = useContext(Context)

      if (value === null) {
        throw new Error(`The ${surface} dictionary was read outside its provider`)
      }

      return value
    },
  }
}
