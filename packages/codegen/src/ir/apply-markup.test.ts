import { el, slot, txt } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { applyMarkup } from './apply-markup'
import type { IRChild } from './ir.types'

const child: IRChild = { kind: 'element', tag: 'p', classNames: [], attributes: {}, children: [] }

const slots = (entries: Readonly<Record<string, readonly IRChild[]>>) =>
  new Map(Object.entries(entries))

describe('applyMarkup', () => {
  it('replaces a slot with the elements the document put in it', () => {
    const applied = applyMarkup(
      el('section', { children: [el('div', { children: [slot()] })] }),
      slots({ children: [child, child] }),
    )
    const inner = applied.root.children[0]

    expect(inner?.kind).toBe('element')
    expect(inner?.kind === 'element' ? inner.children : []).toHaveLength(2)
  })

  it('fills each named slot from its own list', () => {
    const applied = applyMarkup(
      el('div', {
        children: [
          el('div', { classNames: ['left'], children: [slot('left')] }),
          el('div', { classNames: ['right'], children: [slot('right')] }),
        ],
      }),
      slots({ left: [child], right: [child, child] }),
    )
    const [left, right] = applied.root.children

    expect(left?.kind === 'element' ? left.children : []).toHaveLength(1)
    expect(right?.kind === 'element' ? right.children : []).toHaveLength(2)
  })

  it('leaves an unfilled slot as nothing rather than as an empty child', () => {
    const applied = applyMarkup(el('div', { children: [slot()] }), slots({}))

    expect(applied.root.children).toEqual([])
  })

  it('orders and merges the classes of every element, not just the root', () => {
    const applied = applyMarkup(
      el('section', {
        classNames: ['p-4 flex', 'p-6'],
        children: [el('div', { classNames: ['gap-2 items-center'] })],
      }),
      slots({}),
    )
    const inner = applied.root.children[0]

    // `p-6` wins over `p-4` — tailwind-merge semantics at build time, ADR-224.
    expect(applied.root.classNames).toEqual(['flex', 'p-6'])
    expect(inner?.kind === 'element' ? inner.classNames : []).toEqual(['items-center', 'gap-2'])
  })

  it('collects every class in the subtree, which is what the HTML stylesheet reads', () => {
    const applied = applyMarkup(
      el('section', { classNames: ['flex'], children: [el('div', { classNames: ['gap-2'] })] }),
      slots({}),
    )

    expect([...applied.classes].sort()).toEqual(['flex', 'gap-2'])
  })

  it('carries text and expressions through untouched', () => {
    const applied = applyMarkup(
      el('p', { children: [txt('Hello'), { kind: 'expression', code: 'headline' }] }),
      slots({}),
    )

    expect(applied.root.children).toEqual([
      { kind: 'text', value: 'Hello' },
      { kind: 'expression', code: 'headline' },
    ])
  })
})
