'use client'

import { useState } from 'react'

import { MarketingSection } from '../marketing-section'
import { nextHeadingLevel } from '../marketing.schema'

import { IntervalToggle } from './interval-toggle'
import { PricingCards } from './pricing-cards'
import { PricingMatrix } from './pricing-matrix'
import type { PricingTableProps } from './pricing-table.types'

/**
 * The pricing section, in three layouts.
 *
 * The interval is local state, which COMPONENT_LIBRARY.md § Rules 2 allows and the export needs: the
 * toggle has to work in the user's project too, and a prop alone cannot change while a reader is looking
 * at the page. `interval` is the starting value the document stores; the toggle owns it after that.
 */
export function PricingTable({
  eyebrow,
  heading,
  description,
  headingLevel,
  headingAlign,
  layout,
  highlightIndex,
  currency,
  interval,
  showToggle,
  glass,
  plans,
  hidden,
}: PricingTableProps) {
  const [activeInterval, setActiveInterval] = useState(interval)
  const copy = { eyebrow, heading, description, headingLevel, headingAlign }

  return (
    <MarketingSection copy={copy} hidden={hidden} testId="pricing-table">
      {showToggle && (
        <div className="flex w-full justify-center">
          <IntervalToggle onChange={setActiveInterval} value={activeInterval} />
        </div>
      )}

      {layout === 'table' ? (
        <PricingMatrix
          caption={heading === '' ? 'Plan comparison' : heading}
          currency={currency}
          highlightIndex={highlightIndex}
          interval={activeInterval}
          plans={plans}
        />
      ) : (
        <PricingCards
          compact={layout === 'compact'}
          currency={currency}
          glass={glass}
          headingLevel={nextHeadingLevel(headingLevel)}
          highlightIndex={highlightIndex}
          interval={activeInterval}
          plans={plans}
        />
      )}
    </MarketingSection>
  )
}
