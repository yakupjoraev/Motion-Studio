import { describe, expect, it } from 'vitest'

import { BREAKPOINTS, CASCADE_ORDER, isBreakpointId } from './breakpoints'
import { type ResponsiveSource, resolveResponsiveProps } from './resolve'

const source = (
  props: Record<string, unknown>,
  responsive: ResponsiveSource['responsive'] = {},
): ResponsiveSource => ({ props, responsive })

describe('resolveResponsiveProps', () => {
  it('returns the base props when nothing is overridden', () => {
    expect(resolveResponsiveProps(source({ columns: 1, gap: 16 }), 'xl')).toEqual({
      columns: 1,
      gap: 16,
    })
  })

  it('applies an override at its own breakpoint', () => {
    const node = source({ columns: 1 }, { md: { columns: 2 } })

    expect(resolveResponsiveProps(node, 'md')).toEqual({ columns: 2 })
  })

  it('cascades: an md override is still in force at lg and xl', () => {
    const node = source({ columns: 1 }, { md: { columns: 2 } })

    expect(resolveResponsiveProps(node, 'lg')).toEqual({ columns: 2 })
    expect(resolveResponsiveProps(node, 'xl')).toEqual({ columns: 2 })
  })

  it('does not leak downward: an lg override is invisible at md and base', () => {
    const node = source({ columns: 1 }, { lg: { columns: 3 } })

    expect(resolveResponsiveProps(node, 'md')).toEqual({ columns: 1 })
    expect(resolveResponsiveProps(node, 'base')).toEqual({ columns: 1 })
  })

  it('resolves the largest applicable override when several touch one key', () => {
    const node = source(
      { columns: 1 },
      { sm: { columns: 2 }, md: { columns: 3 }, xl: { columns: 5 } },
    )

    expect(resolveResponsiveProps(node, 'lg')).toEqual({ columns: 3 })
    expect(resolveResponsiveProps(node, '2xl')).toEqual({ columns: 5 })
  })

  it('merges keys rather than replacing the object', () => {
    const node = source({ columns: 1, gap: 16, align: 'center' }, { md: { columns: 2 } })

    expect(resolveResponsiveProps(node, 'md')).toEqual({ columns: 2, gap: 16, align: 'center' })
  })

  it('ignores a breakpoint key it does not know instead of throwing', () => {
    const node = source({ columns: 1 }, { '3xl': { columns: 9 } } as ResponsiveSource['responsive'])

    expect(() => resolveResponsiveProps(node, 'xl')).not.toThrow()
    expect(resolveResponsiveProps(node, 'xl')).toEqual({ columns: 1 })
  })

  it('leaves the node untouched', () => {
    const node = source({ columns: 1 }, { md: { columns: 2 } })

    resolveResponsiveProps(node, 'xl')

    expect(node.props).toEqual({ columns: 1 })
  })
})

describe('the breakpoint table', () => {
  it('lists every id in ascending width order', () => {
    const widths = CASCADE_ORDER.map((id) => BREAKPOINTS[id].min)

    expect(widths).toEqual([...widths].sort((a, b) => a - b))
    expect(CASCADE_ORDER).toEqual(Object.keys(BREAKPOINTS))
  })

  it('recognises its own ids and no others', () => {
    expect(isBreakpointId('md')).toBe(true)
    expect(isBreakpointId('3xl')).toBe(false)
  })
})
