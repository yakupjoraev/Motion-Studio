import { Children } from 'react'

import { MarketingSection } from '../marketing-section'

import { BentoCell } from './bento-cell'
import { bentoCells } from './bento-grid.schema'
import { bentoGridStyles } from './bento-grid.styles'
import type { BentoGridProps } from './bento-grid.types'

/**
 * An asymmetric grid whose cells take whatever a user puts in them.
 *
 * The cells are the block's slot, rendered positionally the way the canvas hands children over — the
 * same arrangement `layout/columns` documents. Each child lands in the cell at its index; `bentoCells`
 * decides how many cells there are, so an empty composition is still arrangeable and a child past the
 * end of `cells` still appears.
 */
export function BentoGrid({
  eyebrow,
  heading,
  description,
  headingLevel,
  headingAlign,
  cells,
  gapless,
  cellHeight,
  hidden,
  children,
}: BentoGridProps) {
  const copy = { eyebrow, heading, description, headingLevel, headingAlign }
  const placed = Children.toArray(children)
  const spans = bentoCells(cells, placed.length)

  return (
    <MarketingSection copy={copy} hidden={hidden} testId="bento-grid">
      <div className={bentoGridStyles({ gapless })}>
        {spans.map((span, index) => (
          // The cell's position *is* its identity: `cells` is an arrangement, and the child that lands in
          // a cell is chosen by index. Keying by content would remount every cell when a span changes.
          // biome-ignore lint/suspicious/noArrayIndexKey: the index is the cell's identity, not a stand-in for one.
          <BentoCell gapless={gapless} height={cellHeight} key={`cell-${index}`} span={span}>
            {placed[index]}
          </BentoCell>
        ))}
      </div>
    </MarketingSection>
  )
}
