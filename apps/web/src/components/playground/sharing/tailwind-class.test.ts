import { describe, expect, it } from 'vitest'

import { toArbitrary, toCssVariable, toTailwindClass } from './tailwind-class'

describe('toArbitrary', () => {
  it('spells a space as an underscore, which is how Tailwind reads one', () => {
    expect(toArbitrary('0 8px 24px black')).toBe('0_8px_24px_black')
  })

  it('escapes an underscore the value already had', () => {
    expect(toArbitrary('var(--my_token)')).toBe(String.raw`var(--my\_token)`)
  })

  it('collapses a multi-line value onto one line', () => {
    expect(toArbitrary('0 1px 2px black,\n  0 8px 24px black')).toBe(
      '0_1px_2px_black,_0_8px_24px_black',
    )
  })
})

describe('toTailwindClass', () => {
  it('gives box-shadow the utility Tailwind has for it', () => {
    const tailwind = toTailwindClass('box-shadow', '0 8px 24px black')

    expect(tailwind.className).toBe('shadow-[0_8px_24px_black]')
    expect(tailwind.note).toBeUndefined()
  })

  it('gives everything else the arbitrary property and says why', () => {
    const tailwind = toTailwindClass('clip-path', 'polygon(0% 0%, 100% 0%, 50% 100%)')

    expect(tailwind.className).toBe('[clip-path:polygon(0%_0%,_100%_0%,_50%_100%)]')
    expect(tailwind.note).toContain('theme entry')
  })

  it('does not hand a background shorthand to bg-, which sets something else', () => {
    expect(toTailwindClass('background', 'linear-gradient(red, blue) black').className).toBe(
      '[background:linear-gradient(red,_blue)_black]',
    )
  })
})

describe('toCssVariable', () => {
  it('writes the declaration and the line that uses it', () => {
    expect(toCssVariable('filter', 'blur(4px)')).toBe(
      '--custom: blur(4px);\nfilter: var(--custom);',
    )
  })
})
