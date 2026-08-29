import { describe, expect, it } from 'vitest'

import type { BlockCapabilities } from './registry.types'

import {
  ESCAPE_HATCH_PROPERTIES,
  acceptsEscapeHatch,
  escapeHatchProperties,
  escapeHatchStyle,
  withDeclaration,
} from './escape-hatch'

const capabilities = (escapeHatch?: readonly string[]): BlockCapabilities => ({
  resizable: false,
  fullWidth: false,
  requiresBackdrop: false,
  supportsMotion: [],
  costClass: 'cheap',
  ...(escapeHatch === undefined ? {} : { escapeHatch }),
})

describe('which properties a block accepts', () => {
  it('is the paint-only default when the block says nothing', () => {
    expect(escapeHatchProperties(capabilities())).toEqual(ESCAPE_HATCH_PROPERTIES)
  })

  it('is the block’s own list when it narrows one', () => {
    expect(acceptsEscapeHatch(capabilities(['box-shadow']), 'box-shadow')).toBe(true)
    expect(acceptsEscapeHatch(capabilities(['box-shadow']), 'backdrop-filter')).toBe(false)
  })

  it('accepts nothing at all from a block that declares an empty list', () => {
    expect(acceptsEscapeHatch(capabilities([]), 'background')).toBe(false)
  })

  it('has no layout property in the default set', () => {
    for (const property of ['display', 'position', 'width', 'margin', 'padding', 'float']) {
      expect(ESCAPE_HATCH_PROPERTIES as readonly string[]).not.toContain(property)
    }
  })
})

describe('escapeHatchStyle', () => {
  it('reads the stored declarations in React’s spelling', () => {
    expect(
      escapeHatchStyle(
        { css: 'box-shadow: 0 8px 24px black;\nclip-path: circle(40%)' },
        capabilities(),
      ),
    ).toEqual({ boxShadow: '0 8px 24px black', clipPath: 'circle(40%)' })
  })

  it('drops a property the block does not accept, wherever the document came from', () => {
    expect(
      escapeHatchStyle({ css: 'backdrop-filter: blur(12px)' }, capabilities(['box-shadow'])),
    ).toEqual({})
  })

  it('has nothing to say about a node with no escape hatch', () => {
    expect(escapeHatchStyle({}, capabilities())).toEqual({})
    expect(escapeHatchStyle({ css: '   ' }, capabilities())).toEqual({})
    expect(escapeHatchStyle({ css: 42 }, capabilities())).toEqual({})
  })
})

describe('withDeclaration', () => {
  it('adds a property that was not there', () => {
    expect(withDeclaration('', 'box-shadow', '0 1px 2px black')).toBe('box-shadow: 0 1px 2px black')
  })

  it('replaces one property and keeps the rest', () => {
    expect(
      withDeclaration('clip-path: circle(40%);\nbox-shadow: none', 'box-shadow', '0 1px 2px black'),
    ).toBe('clip-path: circle(40%);\nbox-shadow: 0 1px 2px black')
  })

  it('removes a property when the value is empty', () => {
    expect(withDeclaration('clip-path: circle(40%);\nbox-shadow: none', 'box-shadow', '')).toBe(
      'clip-path: circle(40%)',
    )
  })
})
