import {
  type BlockRegistry,
  type BreakpointId,
  type Node,
  blockId,
  nodeId,
} from '@motion-studio/schema'
import { beforeEach, describe, expect, it } from 'vitest'

import { fixtureRegistry } from '../../test/blocks'
import { FIXTURE_THEME } from '../../test/documents'
import { toIRTheme } from '../build-ir'
import { generateClasses } from './generate-classes'

const theme = toIRTheme(FIXTURE_THEME)
let registry: BlockRegistry

beforeEach(() => {
  registry = fixtureRegistry()
})

const node = (
  block: string,
  props: Record<string, unknown>,
  responsive: Partial<Record<BreakpointId, Record<string, unknown>>> = {},
): Node => ({
  id: nodeId('node_1'),
  blockId: blockId(block),
  name: block,
  parentId: null,
  slot: 'root',
  children: [],
  props,
  responsive,
  motion: {},
  effects: [],
  locked: false,
  hidden: false,
})

const classesOf = (
  block: string,
  props: Record<string, unknown>,
  responsive: Partial<Record<BreakpointId, Record<string, unknown>>> = {},
): string =>
  generateClasses(
    node(block, props, responsive),
    registry.require(blockId(block)),
    theme,
  ).classNames.join(' ')

describe('generateClasses', () => {
  it('emits the static classes and the variant the props select, in Tailwind order', () => {
    expect(classesOf('section', { padding: 'md' })).toBe(
      'relative isolate overflow-hidden px-6 py-16',
    )
  })

  it('emits nothing for a variant whose prop is unset', () => {
    expect(classesOf('section', {})).toBe('relative isolate overflow-hidden')
  })

  it('prints RESPONSIVE_ENGINE.md § Codegen exactly', () => {
    expect(
      classesOf(
        'pricing-grid',
        { columns: 1, gap: 'md' },
        { md: { columns: 2 }, lg: { columns: 3, gap: 'lg' } },
      ),
    ).toBe('grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-8')
  })

  it('drops an override equal to the value it inherits', () => {
    const withRedundant = classesOf(
      'pricing-grid',
      { columns: 1, gap: 'md' },
      { md: { columns: 2 }, xl: { gap: 'md' } },
    )

    expect(withRedundant).toBe('grid grid-cols-1 gap-4 md:grid-cols-2')
  })

  it('resolves a variant that overrides its own static base at build time', () => {
    expect(classesOf('panel', { density: 'compact' })).toBe('rounded-lg p-2')
  })

  it('reports an override it cannot prefix rather than emitting md:sm:grid-cols-2', () => {
    const result = generateClasses(
      node('stepped-grid', { columns: 1 }, { md: { columns: 3 } }),
      registry.require(blockId('stepped-grid')),
      theme,
    )

    expect(result.classNames).toEqual(['grid', 'grid-cols-1'])
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0]?.code).toBe('unsupported')
  })

  it('answers with nothing at all for a block that declares no class plan', () => {
    const result = generateClasses(
      node('undeclared', { padding: 'md' }),
      registry.require(blockId('undeclared')),
      theme,
    )

    expect(result.classNames).toEqual([])
    expect(result.consumed).toEqual([])
  })

  it('names the props a rule read, so the caller knows what is left', () => {
    const result = generateClasses(
      node('section', { padding: 'md', tint: 'oklch(20% 0 0)' }),
      registry.require(blockId('section')),
      theme,
    )

    expect(result.consumed).toEqual(['padding', 'hidden', 'tint'])
  })

  describe('a value with no Tailwind equivalent', () => {
    const result = () =>
      generateClasses(
        node(
          'section',
          { padding: 'md', tint: 'oklch(20% 0 0)' },
          { md: { tint: 'oklch(30% 0 0)' } },
        ),
        registry.require(blockId('section')),
        theme,
      )

    it('becomes a class rather than an arbitrary-value class', () => {
      expect(result().classNames).toContain('v-section-tint')
      expect(result().classNames.join(' ')).not.toContain('[')
    })

    it('puts the value on the element as a custom property', () => {
      expect(result().cssVars).toEqual({
        '--ms-section-tint': 'oklch(20% 0 0)',
        '--ms-section-tint-md': 'oklch(30% 0 0)',
      })
    })

    it('puts the declaration in the stylesheet, with a media query per override', () => {
      expect(result().rules).toEqual([
        {
          selector: '.v-section-tint',
          declarations: ['background-color: var(--ms-section-tint)'],
        },
        {
          selector: '.v-section-tint',
          declarations: ['background-color: var(--ms-section-tint-md)'],
          media: '(min-width: 768px)',
        },
      ])
    })
  })

  it('drops a custom override that repeats the inherited value', () => {
    const result = generateClasses(
      node('section', { tint: 'red' }, { md: { tint: 'red' } }),
      registry.require(blockId('section')),
      theme,
    )

    expect(result.rules).toHaveLength(1)
    expect(result.cssVars).toEqual({ '--ms-section-tint': 'red' })
  })
})
