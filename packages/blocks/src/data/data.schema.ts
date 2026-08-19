import { z } from 'zod'

import { visibility } from '../scales'

/**
 * The category's shared vocabulary, declared here for the reason every category before it declared its
 * own: a length cap is a one-line contract, and a cross-category import of one would tie a table's cell
 * limit to a pricing card's.
 */
export const LABEL_MAX_LENGTH = 48
export const CELL_MAX_LENGTH = 120
export const CAPTION_MAX_LENGTH = 96

/**
 * The sentence a screen reader gets instead of the picture. Longer than a label because it has to carry
 * the shape of the data — "Revenue growth from 12 to 84 over 6 months" is the whole point of the prop.
 */
export const SUMMARY_MAX_LENGTH = 200

export const MAX_SERIES_POINTS = 48
export const MIN_SERIES_POINTS = 2

/**
 * How tightly a data block packs its rows. Three steps rather than two: a 50-row table and a 4-row one
 * want different vertical rhythm, and the middle step is the one every other block in the catalogue uses.
 */
export const DENSITIES = ['compact', 'default', 'comfortable'] as const

export type Density = (typeof DENSITIES)[number]

export const density = z.enum(DENSITIES)

/** Every block in the category answers the responsive visibility prop — ADR-117. */
export const dataFrameFields = () => ({ hidden: visibility })

/**
 * The frame for a block whose contents scroll. The label is required rather than optional, because the
 * scroller is a `role="region"` a keyboard reader lands in, and a region with no name is announced as
 * "region" — ACCESSIBILITY.md § Non-negotiables 2.
 */
export const scrollRegionFields = (label: string) => ({
  regionLabel: z.string().min(1).max(LABEL_MAX_LENGTH).default(label),
  ...dataFrameFields(),
})

export type DataFrameShape = { readonly hidden: boolean }

export type ScrollRegionShape = DataFrameShape & { readonly regionLabel: string }

/**
 * A numeric series, inline. Never fetched, and never longer than the caps above — a landing-page chart
 * with 400 points is a screenshot of a dashboard, not a block.
 */
export const seriesField = z.array(z.number()).min(MIN_SERIES_POINTS).max(MAX_SERIES_POINTS)
