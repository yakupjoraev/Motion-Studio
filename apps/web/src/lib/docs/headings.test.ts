import { describe, expect, it } from 'vitest'

import { createSlugger, slugify } from './headings'

describe('slugify', () => {
  it.each([
    ['Reduced motion', 'reduced-motion'],
    ['9. Decision discipline', 'decision-discipline'],
    ['`.motion` schema', 'motion-schema'],
    ['Drag & drop — the four operations', 'drag-drop-the-four-operations'],
    ['§', 'section'],
  ])('%s → %s', (text, slug) => {
    expect(slugify(text)).toBe(slug)
  })
})

describe('createSlugger', () => {
  it('numbers a repeated heading from the second occurrence', () => {
    const slugFor = createSlugger()

    expect([slugFor('Question'), slugFor('Question'), slugFor('Question')]).toEqual([
      'question',
      'question-2',
      'question-3',
    ])
  })

  it('does not collide when two headings normalise to the same slug', () => {
    const slugFor = createSlugger()

    expect([slugFor('Reduced motion'), slugFor('Reduced Motion')]).toEqual([
      'reduced-motion',
      'reduced-motion-2',
    ])
  })
})
