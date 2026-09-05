import { presetCopy } from '@motion-studio/motion/i18n'
import { describe, expect, it } from 'vitest'

import { searchPresets } from './use-preset-search'

const ids = (query: string, copy = presetCopy('en')): readonly string[] =>
  searchPresets(query, new Set(), copy).presets.map((preset) => preset.id)

const russian = presetCopy('ru')

describe('searching the motion catalogue', () => {
  it('matches the English name in an English session', () => {
    expect(ids('blur in')).toContain('blur-in')
  })

  /**
   * The label searched is the label on screen. A Russian session that answered only to English
   * names would look like a broken search rather than a missing translation.
   */
  it('matches the translated name in a Russian session', () => {
    expect(ids('размыт', russian)).toContain('blur-in')
    expect(ids('прокрутк', russian)).toContain('scroll-fade')
  })

  it('keeps the English name and the id working in Russian, for a name read in the docs', () => {
    expect(ids('blur-in', russian)).toContain('blur-in')
    expect(ids('marquee', russian)).toContain('marquee')
  })

  it('filters by channel before it ranks', () => {
    const exits = searchPresets('', new Set(['exit']), russian).presets

    expect(exits.every((preset) => preset.channel === 'exit')).toBe(true)
  })
})
