import { screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'
import { requireAt } from '../../test/require-at'

import { PricingTable } from './pricing-table'
import { pricingTableDefinition as definition } from './pricing-table.definition'
import { featureMatrixRows, planIncludes, priceIsNumeric } from './pricing-table.schema'

/**
 * The classes that can change a card's height. jsdom has no layout — every `offsetHeight` is 0 — so the
 * assertion prompt 38 asks for ("highlight does not change sibling heights") is made on the geometry the
 * classes declare, which is what the browser would then measure. The measured version is in ADR-187.
 */
const GEOMETRY = /^(p|px|py|pt|pb|gap|min-h|h|text|mt|mb|leading)-/

const geometryOf = (element: Element): readonly string[] =>
  element.className
    .split(' ')
    .filter((name) => GEOMETRY.test(name))
    .sort()

describe('pricing arithmetic', () => {
  it('reads a numeric price as one and a word as not', () => {
    expect(priceIsNumeric('19')).toBe(true)
    expect(priceIsNumeric('2,400')).toBe(true)
    expect(priceIsNumeric('Custom')).toBe(false)
    expect(priceIsNumeric('Free')).toBe(false)
  })

  it('builds matrix rows as the union of every plan, in first-appearance order', () => {
    const rows = featureMatrixRows([
      { ...requireAt(definition.defaults.plans, 0), features: [{ label: 'A', included: true }] },
      {
        ...requireAt(definition.defaults.plans, 1),
        features: [
          { label: 'A', included: false },
          { label: 'B', included: true },
        ],
      },
    ])

    expect(rows).toEqual(['A', 'B'])
  })

  it('answers undefined for a feature a plan never mentioned', () => {
    const plan = {
      ...requireAt(definition.defaults.plans, 0),
      features: [{ label: 'A', included: false }],
    }

    expect(planIncludes(plan, 'A')).toBe(false)
    expect(planIncludes(plan, 'B')).toBeUndefined()
  })
})

describe('PricingTable — cards', () => {
  it('renders every plan as an article with its name as the heading', () => {
    renderBlock(definition, PricingTable)

    const cards = screen.getAllByRole('article')

    expect(cards).toHaveLength(definition.defaults.plans.length)
    expect(screen.getByRole('heading', { name: 'Studio' })).toBeInTheDocument()
  })

  it('keeps the price out of the heading structure', () => {
    renderBlock(definition, PricingTable)

    for (const heading of screen.getAllByRole('heading')) {
      expect(heading.textContent).not.toMatch(/\$\d/)
    }
  })

  it('changes every price when the interval toggle is pressed', async () => {
    const user = userEvent.setup()

    renderBlock(definition, PricingTable)

    expect(screen.getAllByTestId('plan-price')[1]).toHaveTextContent('$19/month')

    await user.click(screen.getByRole('button', { name: 'Yearly' }))

    expect(screen.getAllByTestId('plan-price')[1]).toHaveTextContent('$190/year')
    expect(screen.getByRole('button', { name: 'Yearly' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('is operable from the keyboard alone', async () => {
    const user = userEvent.setup()

    renderBlock(definition, PricingTable)

    await user.tab()
    await user.tab()
    await user.keyboard(' ')

    expect(screen.getByRole('button', { name: 'Yearly' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('opens on the interval the document stored', () => {
    renderBlock(definition, PricingTable, { interval: 'year' })

    expect(screen.getAllByTestId('plan-price')[1]).toHaveTextContent('$190/year')
  })

  it('drops the currency and the suffix from a price that is a word', () => {
    renderBlock(definition, PricingTable, {
      plans: [
        {
          ...requireAt(definition.defaults.plans, 0),
          priceMonthly: 'Custom',
          priceYearly: 'Custom',
        },
      ],
    })

    expect(screen.getByTestId('plan-price').textContent).toBe('Custom')
  })

  it('changes nothing geometric on the highlighted card', () => {
    renderBlock(definition, PricingTable, { highlightIndex: 1 })

    const [plain, highlighted] = screen.getAllByTestId('plan-card')

    expect(highlighted).toHaveAttribute('data-highlighted', 'true')
    expect(geometryOf(highlighted as Element)).toEqual(geometryOf(plain as Element))
  })

  it('leaves the other cards untouched whether anything is highlighted or not', () => {
    const { unmount } = renderBlock(definition, PricingTable, { highlightIndex: -1 })
    const unhighlighted = screen.getAllByTestId('plan-card').map(geometryOf)

    unmount()

    renderBlock(definition, PricingTable, { highlightIndex: 1 })
    const highlighted = screen.getAllByTestId('plan-card').map(geometryOf)

    expect(highlighted[0]).toEqual(unhighlighted[0])
    expect(highlighted[2]).toEqual(unhighlighted[2])
  })

  it('takes the badge out of the flow so it costs no height', () => {
    renderBlock(definition, PricingTable, { highlightIndex: 1 })

    expect(screen.getByTestId('plan-badge').className).toContain('absolute')
  })

  it('shows the badge only on the highlighted plan', () => {
    renderBlock(definition, PricingTable, { highlightIndex: -1 })

    expect(screen.queryByTestId('plan-badge')).toBeNull()
  })

  it('brings the highlighted plan first where the cards stack', () => {
    renderBlock(definition, PricingTable, { highlightIndex: 1 })

    expect(screen.getAllByTestId('plan-card')[1]?.className).toContain(
      '@max-[639px]/frame:order-first',
    )
  })

  it('marks an excluded feature with a dash and says so off screen', () => {
    renderBlock(definition, PricingTable)

    const marks = screen.getAllByTestId('plan-feature-mark')
    const excluded = marks.filter((mark) => mark.dataset['included'] === 'false')

    expect(excluded.length).toBeGreaterThan(0)
    expect(screen.getAllByText('— not included').length).toBe(excluded.length)
  })
})

describe('PricingTable — the narrow arrangement', () => {
  /*
   * ADR-357, and plans are the case that most needs it: a plan card is tall, so three stacked put the
   * third one two screens below the first and nobody compares what they cannot see together.
   */
  const track = (): HTMLElement => {
    const card = screen.getAllByTestId('plan-card')[0]
    const parent = card?.parentElement

    if (parent === null || parent === undefined) {
      throw new Error('the plan cards have no container')
    }

    return parent
  }

  it('makes a keyboard-reachable swipe track when it is a slider', () => {
    renderBlock(definition, PricingTable, { narrow: 'slider' })

    expect(track()).toHaveAttribute('tabindex', '0')
    expect(track().className).toContain('snap-x')
    expect(track().className).toContain('-mx-6')
    expect(track().className).toContain('@min-[640px]/frame:grid')
  })

  it('is a plain single column when it is a stack', () => {
    renderBlock(definition, PricingTable, { narrow: 'stack' })

    expect(track()).not.toHaveAttribute('tabindex')
    expect(track().className).toContain('grid-cols-1')
    expect(track().className).not.toContain('snap-x')
  })

  it('defaults to the slider', () => {
    expect(definition.defaults.narrow).toBe('slider')
  })
})

describe('PricingTable — compact', () => {
  it('drops the feature lists', () => {
    renderBlock(definition, PricingTable, { layout: 'compact' })

    expect(screen.queryByTestId('plan-features')).toBeNull()
    expect(screen.getAllByRole('article')).toHaveLength(definition.defaults.plans.length)
  })
})

describe('PricingTable — table', () => {
  it('is a real table with a caption and both header directions', () => {
    renderBlock(definition, PricingTable, { layout: 'table' })

    const table = screen.getByTestId('pricing-matrix')

    expect(table.tagName).toBe('TABLE')
    expect(table.querySelector('caption')?.textContent).toBe(definition.defaults.heading)
    expect(table.querySelectorAll('th[scope="col"]')).toHaveLength(
      definition.defaults.plans.length + 1,
    )
    expect(table.querySelectorAll('th[scope="row"]')).toHaveLength(
      featureMatrixRows(definition.defaults.plans).length,
    )
  })

  it('scrolls inside its own container rather than widening the page', () => {
    renderBlock(definition, PricingTable, { layout: 'table' })

    expect(screen.getByTestId('pricing-matrix').parentElement?.className).toContain(
      'overflow-x-auto',
    )
  })

  it('answers every cell in words as well as in a glyph', () => {
    renderBlock(definition, PricingTable, { layout: 'table' })

    const rows = featureMatrixRows(definition.defaults.plans).length
    const cells = rows * definition.defaults.plans.length

    expect(screen.getAllByText(/^(Included|Not included)$/)).toHaveLength(cells)
  })
})

describe('PricingTable — accessibility', () => {
  it('has no axe violations as cards', async () => {
    const { container } = renderBlock(definition, PricingTable)

    await expectNoViolations(container)
  })

  it('has no axe violations as a matrix', async () => {
    const { container } = renderBlock(definition, PricingTable, { layout: 'table' })

    await expectNoViolations(container)
  })
})
