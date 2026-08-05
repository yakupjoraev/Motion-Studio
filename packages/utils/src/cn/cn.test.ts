import { describe, expect, it } from 'vitest'

import { cn } from './cn'

describe('cn', () => {
  it('joins plain class names', () => {
    expect(cn('flex', 'items-center')).toBe('flex items-center')
  })

  it('drops falsy values instead of emitting them', () => {
    expect(cn('flex', false, undefined, null, '', 'gap-2')).toBe('flex gap-2')
  })

  it('keeps the class from a truthy conditional and omits the other', () => {
    const isActive = true

    expect(cn('base', isActive && 'is-active', !isActive && 'is-idle')).toBe('base is-active')
  })

  it('flattens arrays and objects the way clsx does', () => {
    expect(cn(['flex', ['gap-2']], { 'text-sm': true, 'text-lg': false })).toBe(
      'flex gap-2 text-sm',
    )
  })

  it('resolves a Tailwind conflict in favour of the later utility', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('does not treat different Tailwind groups as conflicting', () => {
    expect(cn('px-2', 'py-4')).toBe('px-2 py-4')
  })

  it('lets a caller override a base class, which is why components take a className prop', () => {
    expect(cn('bg-surface-1 text-sm', 'bg-surface-2')).toBe('text-sm bg-surface-2')
  })

  it('returns an empty string when given nothing', () => {
    expect(cn()).toBe('')
  })
})
