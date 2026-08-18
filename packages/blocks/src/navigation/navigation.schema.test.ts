import { describe, expect, it } from 'vitest'

import {
  isActiveHref,
  navChildSchema,
  navItemSchema,
  navLinkSchema,
  socialAccessibleName,
  socialSchema,
} from './navigation.schema'

describe('isActiveHref', () => {
  it('matches the current page exactly', () => {
    expect(isActiveHref('#docs', '#docs')).toBe(true)
    expect(isActiveHref('#docs', '#docs/blocks')).toBe(false)
  })

  it('calls nothing current when nothing is', () => {
    expect(isActiveHref('#docs', '')).toBe(false)
    expect(isActiveHref('', '')).toBe(false)
  })
})

describe('socialAccessibleName', () => {
  it('says where the link goes rather than what the glyph is', () => {
    const name = socialAccessibleName('Motion Studio', 'GitHub')

    expect(name).toBe('Motion Studio on GitHub')
    expect(name).not.toBe('GitHub')
  })

  it('still says something with no brand to say it about', () => {
    expect(socialAccessibleName('', 'GitHub')).toBe('Open GitHub')
  })
})

describe('the link shapes', () => {
  it('refuses an unnamed link', () => {
    expect(() => navLinkSchema.parse({ label: '' })).toThrow()
    expect(() => navChildSchema.parse({ label: '' })).toThrow()
    expect(() => socialSchema.parse({ network: '' })).toThrow()
  })

  it('lets a top-level item be a pure dropdown trigger', () => {
    const item = navItemSchema.parse({ label: 'Docs', href: '' })

    expect(item.href).toBe('')
    expect(item.children).toEqual([])
  })

  it('holds one level of children and no more', () => {
    const item = navItemSchema.parse({
      label: 'Docs',
      children: [{ label: 'Guides', href: '#guides' }],
    })

    expect(item.children).toEqual([{ label: 'Guides', href: '#guides', description: '' }])
    expect('children' in (item.children[0] ?? {})).toBe(false)
  })
})
