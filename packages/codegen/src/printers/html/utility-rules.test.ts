import type { MarkupChild } from '@motion-studio/schema'
import { LIGHT, RADIUS, SPACE } from '@motion-studio/tokens'
import { describe, expect, it } from 'vitest'

import { FIXTURE_BLOCKS } from '../../test/blocks'
import { fixtureMarkup } from '../../test/markup'

import { KEYWORDS } from './utility-keywords'
import { declarationsFor } from './utility-rules'

/**
 * Every class a fixture's producer can put on an element, gathered by running it — the producers hold
 * the mapping now, so the completeness gate reads them rather than a declaration (ADR-252).
 *
 * The props are the union of every variant the fixtures switch on, so one run reaches every branch a
 * table has; a producer that ignores a prop simply produces its own classes twice.
 */
const VARIANTS: readonly Record<string, unknown>[] = [
  { padding: 'sm', columns: 1, gap: 'sm', density: 'compact', mode: 'explicit', hidden: false },
  { padding: 'md', columns: 2, gap: 'md', density: 'loose', mode: 'auto-fit', hidden: true },
  { padding: 'lg', columns: 3, gap: 'lg' },
]

const walk = (node: MarkupChild, into: string[]): void => {
  if (node.kind !== 'element') {
    return
  }

  into.push(...node.classNames)

  for (const child of node.children) {
    walk(child, into)
  }
}

function classesOf(id: string): readonly string[] {
  const producer = fixtureMarkup[id]

  if (producer === undefined) {
    return []
  }

  const found: string[] = []

  for (const props of VARIANTS) {
    walk(producer({ props, id: 'fixture', slots: {} }), found)
  }

  return found
}

/**
 * ADR-238's claim, checked rather than asserted in prose: every declaration this table produces for a
 * themed value points at the `--ms-*` variable `packages/tokens` § to-tailwind points the same Tailwind
 * namespace at. If the two ever disagree, the HTML export paints a different colour from the React one
 * for the same document, which is the failure the ADR exists to prevent.
 */
describe('declarationsFor', () => {
  it('resolves a keyword whose whole name is the value', () => {
    expect(declarationsFor('flex')).toEqual(['display: flex'])
    expect(declarationsFor('hidden')).toEqual(['display: none'])
    expect(declarationsFor('text-center')).toEqual(['text-align: center'])
  })

  it('resolves spacing through the space scale', () => {
    expect(declarationsFor('px-6')).toEqual(['padding-inline: var(--ms-space-6)'])
    expect(declarationsFor('py-24')).toEqual(['padding-block: var(--ms-space-24)'])
    expect(declarationsFor('gap-x-4')).toEqual(['column-gap: var(--ms-space-4)'])
  })

  it('resolves radius and colour through their own scales', () => {
    expect(declarationsFor('rounded-xl')).toEqual(['border-radius: var(--ms-radius-xl)'])
    expect(declarationsFor('bg-surface-1')).toEqual(['background-color: var(--ms-color-surface-1)'])
    expect(declarationsFor('text-accent')).toEqual(['color: var(--ms-color-accent)'])
  })

  /** The one place `text-` is ambiguous, and the one the type scale wins. */
  it('reads a type-scale step as a font size, not a colour', () => {
    expect(declarationsFor('text-lg')).toEqual([
      'font-size: var(--ms-text-lg)',
      'line-height: var(--ms-text-lg-line-height)',
      'letter-spacing: var(--ms-text-lg-tracking)',
    ])
  })

  it('reads a number after border- as a width and a token as a colour', () => {
    expect(declarationsFor('border-2')).toEqual(['border-width: 2px'])
    expect(declarationsFor('border-accent')).toEqual(['border-color: var(--ms-color-accent)'])
    expect(declarationsFor('border')).toEqual(['border-style: solid', 'border-width: 1px'])
  })

  it('takes the longer prefix first', () => {
    expect(declarationsFor('max-w-3xl')).toEqual(['max-width: 48rem'])
    expect(declarationsFor('w-full')).toEqual(['width: 100%'])
    expect(declarationsFor('gap-2')).toEqual(['gap: var(--ms-space-2)'])
  })

  it('reads an arbitrary value out of the class rather than out of a table', () => {
    expect(declarationsFor('grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]')).toEqual([
      'grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr))',
    ])
    expect(declarationsFor('p-[3px]')).toEqual(['padding: 3px'])
  })

  it('negates through calc rather than by writing a minus in front of a variable', () => {
    expect(declarationsFor('-mt-4')).toEqual(['margin-top: calc(-1 * var(--ms-space-4))'])
  })

  it('expands a grid column count into a real template', () => {
    expect(declarationsFor('grid-cols-3')).toEqual([
      'grid-template-columns: repeat(3, minmax(0, 1fr))',
    ])
  })

  it('returns undefined rather than guessing', () => {
    expect(declarationsFor('ms-reveal')).toBeUndefined()
    expect(declarationsFor('bg-not-a-token')).toBeUndefined()
    expect(declarationsFor('prose')).toBeUndefined()
  })

  /**
   * The completeness gate. Every class any fixture descriptor can emit has to resolve, because a class
   * with no rule is a block that paints nothing in the HTML export and says so only in a warning.
   */
  it('covers every class the fixture catalogue can produce', () => {
    const classes = FIXTURE_BLOCKS.flatMap((block) => classesOf(String(block.id)))
    const unresolved = [...new Set(classes)]
      .map((className) => className.replace(/^[a-z0-9]+:/, ''))
      .filter((utility) => declarationsFor(utility) === undefined)

    expect(unresolved).toEqual([])
  })

  it('names every scale it resolves against off the token package', () => {
    expect(declarationsFor(`p-${Object.keys(SPACE).at(-1)}`)).toBeDefined()
    expect(declarationsFor(`rounded-${Object.keys(RADIUS).at(-1)}`)).toBeDefined()
    expect(declarationsFor(`bg-${Object.keys(LIGHT).at(-1)}`)).toBeDefined()
  })

  it('keeps the visually-hidden keyword focusable', () => {
    expect(KEYWORDS['sr-only']).toContain('position: absolute')
    expect(KEYWORDS['sr-only']).not.toContain('display: none')
  })
})
