import { describe, expect, it } from 'vitest'

import { deepEqual, deletePath, getPath, omit, pick, setPath } from './object'

describe('getPath', () => {
  it('reads a dotted path', () => {
    expect(getPath({ theme: { palette: { accent: 'violet' } } }, 'theme.palette.accent')).toBe(
      'violet',
    )
  })

  it('reads a bracketed array index', () => {
    expect(getPath({ a: [{ b: 1 }] }, 'a[0].b')).toBe(1)
  })

  it('reads consecutive indices', () => {
    expect(getPath({ grid: [[7, 8]] }, 'grid[0][1]')).toBe(8)
  })

  it('accepts a numeric segment written after a dot', () => {
    expect(getPath({ a: [{ b: 1 }] }, 'a.0.b')).toBe(1)
  })

  it('returns undefined for a missing key rather than throwing', () => {
    expect(getPath({ a: 1 }, 'b')).toBeUndefined()
    expect(getPath({ a: 1 }, 'a.b.c')).toBeUndefined()
  })

  it('returns undefined when the path runs into a primitive', () => {
    expect(getPath({ a: 'text' }, 'a.length.deeper')).toBeUndefined()
  })

  it('returns undefined for a missing array index', () => {
    expect(getPath({ a: [] }, 'a[3]')).toBeUndefined()
  })

  it('returns the target itself for an empty path', () => {
    const target = { a: 1 }

    expect(getPath(target, '')).toBe(target)
  })

  it('returns undefined when the target is not an object', () => {
    expect(getPath(null, 'a')).toBeUndefined()
    expect(getPath(7, 'a')).toBeUndefined()
  })

  it('reads a falsy leaf without confusing it with a missing one', () => {
    expect(getPath({ a: 0 }, 'a')).toBe(0)
    expect(getPath({ a: false }, 'a')).toBe(false)
    expect(getPath({ a: null }, 'a')).toBeNull()
  })
})

describe('setPath', () => {
  it('writes a shallow key', () => {
    const target = { a: 1 }

    setPath(target, 'a', 2)

    expect(target).toEqual({ a: 2 })
  })

  it('writes a nested key that already exists', () => {
    const target = { theme: { palette: { accent: 'violet' } } }

    setPath(target, 'theme.palette.accent', 'teal')

    expect(target.theme.palette.accent).toBe('teal')
  })

  it('creates intermediate objects and arrays, choosing by the next segment', () => {
    const target = {}

    setPath(target, 'a[0].b', 1)

    expect(target).toEqual({ a: [{ b: 1 }] })
  })

  it('creates a nested object chain for non-numeric segments', () => {
    const target = {}

    setPath(target, 'a.b.c', 'value')

    expect(target).toEqual({ a: { b: { c: 'value' } } })
  })

  it('creates an array when the first segment after the root is numeric', () => {
    const target: Record<string, unknown> = {}

    setPath(target, 'items[2]', 'third')

    expect(Array.isArray(target['items'])).toBe(true)
    expect(target).toEqual({ items: [undefined, undefined, 'third'] })
  })

  it('reuses an existing container instead of replacing it', () => {
    const inner = { keep: 1 }
    const target = { a: inner }

    setPath(target, 'a.added', 2)

    expect(target.a).toBe(inner)
    expect(target).toEqual({ a: { keep: 1, added: 2 } })
  })

  it('replaces a primitive standing where a container is needed', () => {
    const target = { a: 'text' }

    setPath(target, 'a.b', 1)

    expect(target).toEqual({ a: { b: 1 } })
  })

  it('appends to an existing array', () => {
    const target = { items: ['first'] }

    setPath(target, 'items[1]', 'second')

    expect(target.items).toEqual(['first', 'second'])
  })

  it('is a no-op for an empty path', () => {
    const target = { a: 1 }

    setPath(target, '', 2)

    expect(target).toEqual({ a: 1 })
  })

  it('is a no-op when the target is not an object', () => {
    expect(() => setPath(null, 'a', 1)).not.toThrow()
    expect(() => setPath(7, 'a', 1)).not.toThrow()
  })
})

describe('deletePath', () => {
  it('removes a shallow key', () => {
    const target = { a: 1, b: 2 }

    deletePath(target, 'a')

    expect(target).toEqual({ b: 2 })
  })

  it('removes a nested key', () => {
    const target = { theme: { accent: 'violet', neutral: 'slate' } }

    deletePath(target, 'theme.accent')

    expect(target).toEqual({ theme: { neutral: 'slate' } })
  })

  it('splices an array index rather than leaving a hole', () => {
    const target = { items: ['a', 'b', 'c'] }

    deletePath(target, 'items[1]')

    expect(target.items).toEqual(['a', 'c'])
    expect(target.items).toHaveLength(2)
  })

  it('leaves no hole that a JSON round-trip would turn into null', () => {
    const target = { items: ['a', 'b'] }

    deletePath(target, 'items[0]')

    expect(JSON.parse(JSON.stringify(target))).toEqual(target)
  })

  it('deletes a numeric key from an object without splicing', () => {
    const target = { map: { 0: 'a', 1: 'b' } }

    deletePath(target, 'map.0')

    expect(target).toEqual({ map: { 1: 'b' } })
  })

  it('is a no-op for a missing path', () => {
    const target = { a: 1 }

    deletePath(target, 'b.c.d')

    expect(target).toEqual({ a: 1 })
  })

  it('is a no-op when the path runs into a primitive', () => {
    const target = { a: 'text' }

    deletePath(target, 'a.b')

    expect(target).toEqual({ a: 'text' })
  })

  it('is a no-op for an empty path or a non-object target', () => {
    const target = { a: 1 }

    deletePath(target, '')

    expect(target).toEqual({ a: 1 })
    expect(() => deletePath(null, 'a')).not.toThrow()
  })
})

describe('deepEqual', () => {
  it('compares primitives', () => {
    expect(deepEqual(1, 1)).toBe(true)
    expect(deepEqual('a', 'a')).toBe(true)
    expect(deepEqual(1, 2)).toBe(false)
    expect(deepEqual(1, '1')).toBe(false)
  })

  it('treats NaN as equal to NaN, because Object.is does', () => {
    expect(deepEqual(Number.NaN, Number.NaN)).toBe(true)
  })

  it('distinguishes +0 from -0, because Object.is does', () => {
    expect(deepEqual(0, -0)).toBe(false)
  })

  it('compares null and undefined as distinct', () => {
    expect(deepEqual(null, null)).toBe(true)
    expect(deepEqual(null, undefined)).toBe(false)
  })

  it('compares arrays element by element', () => {
    expect(deepEqual([1, [2, 3]], [1, [2, 3]])).toBe(true)
    expect(deepEqual([1, 2], [1, 3])).toBe(false)
  })

  it('compares array lengths', () => {
    expect(deepEqual([1, 2], [1, 2, 3])).toBe(false)
  })

  it('compares plain objects by key and value', () => {
    expect(deepEqual({ a: 1, b: { c: 2 } }, { a: 1, b: { c: 2 } })).toBe(true)
    expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false)
  })

  it('ignores key order', () => {
    expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true)
  })

  it('compares key counts', () => {
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false)
  })

  it('is false when the key sets differ but the counts match', () => {
    expect(deepEqual({ a: 1 }, { b: 1 })).toBe(false)
  })

  it('does not treat an array as equal to an object with the same indices', () => {
    expect(deepEqual([1], { 0: 1 })).toBe(false)
  })

  it('compares non-JSON objects by reference, as documented', () => {
    const date = new Date(0)

    expect(deepEqual(date, date)).toBe(true)
    expect(deepEqual(new Date(0), new Date(0))).toBe(false)
  })

  it('round-trips a document-shaped value through JSON and still compares equal', () => {
    const document = { rootId: 'node_1', nodes: { node_1: { children: ['node_2'] } } }

    expect(deepEqual(JSON.parse(JSON.stringify(document)), document)).toBe(true)
  })
})

describe('pick', () => {
  it('keeps only the listed keys', () => {
    expect(pick({ a: 1, b: 2, c: 3 }, ['a', 'c'])).toEqual({ a: 1, c: 3 })
  })

  it('does not mutate the source', () => {
    const source = { a: 1, b: 2 }

    pick(source, ['a'])

    expect(source).toEqual({ a: 1, b: 2 })
  })

  it('returns an empty object for an empty key list', () => {
    expect(pick({ a: 1 }, [])).toEqual({})
  })

  it('keeps the source key order rather than the listed order', () => {
    expect(Object.keys(pick({ a: 1, b: 2, c: 3 }, ['c', 'a']))).toEqual(['a', 'c'])
  })

  it('keeps a key whose value is undefined', () => {
    expect(pick({ a: undefined, b: 1 }, ['a'])).toEqual({ a: undefined })
  })
})

describe('omit', () => {
  it('removes the listed keys', () => {
    expect(omit({ a: 1, b: 2, c: 3 }, ['b'])).toEqual({ a: 1, c: 3 })
  })

  it('does not mutate the source', () => {
    const source = { a: 1, b: 2 }

    omit(source, ['b'])

    expect(source).toEqual({ a: 1, b: 2 })
  })

  it('returns a copy for an empty key list', () => {
    const source = { a: 1 }
    const result = omit(source, [])

    expect(result).toEqual({ a: 1 })
    expect(result).not.toBe(source)
  })

  it('removes every listed key', () => {
    expect(omit({ a: 1, b: 2, c: 3 }, ['a', 'b', 'c'])).toEqual({})
  })
})
