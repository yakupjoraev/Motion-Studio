/**
 * The shape of the imported Uiverse catalogue — `scripts/import-uiverse.ts` writes it, this package
 * reads it. Everything here is data as published upstream; nothing is a Motion Studio block until a
 * person promotes it, which is a separate decision with its own schema and controls.
 */

export const UIVERSE_CATEGORIES = [
  'buttons',
  'cards',
  'checkboxes',
  'forms',
  'inputs',
  'loaders',
  'notifications',
  'patterns',
  'radio-buttons',
  'toggle-switches',
  'tooltips',
] as const

export type UiverseCategory = (typeof UIVERSE_CATEGORIES)[number]

export const isUiverseCategory = (value: string): value is UiverseCategory =>
  (UIVERSE_CATEGORIES as readonly string[]).includes(value)

export interface UiverseElement {
  /** `<category>/<author>_<slug>`, unique across the catalogue. */
  readonly id: string
  readonly category: UiverseCategory
  readonly author: string
  readonly slug: string
  readonly tags: readonly string[]
  readonly html: string
  /** Empty for a Tailwind element, whose styling is in its class names. */
  readonly css: string
  readonly styling: 'css' | 'tailwind'
  /** Present when the attribution names the element this one was republished from. */
  readonly origin?: string
}

/** What `viewCount` on the element's own page said, and when it was read. */
export interface UiverseViews {
  readonly collected: string
  readonly views: Readonly<Record<string, number>>
}

export interface UiverseCategorySummary {
  readonly category: UiverseCategory
  readonly elements: number
  readonly tailwind: number
  readonly authors: number
}

export interface UiverseIndex {
  readonly source: string
  readonly licence: string
  readonly imported: string
  readonly categories: readonly UiverseCategorySummary[]
  readonly total: number
}
