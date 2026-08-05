import { describe, expect, it } from 'vitest'

import { groupBy, insertAt, move, partition, removeAt, unique } from './array'

describe('move', () => {
  it('moves an item forward', () => {
    expect(move(['a', 'b', 'c', 'd'], 0, 2)).toEqual(['b', 'c', 'a', 'd'])
  })

  it('moves an item backward', () => {
    expect(move(['a', 'b', 'c', 'd'], 3, 1)).toEqual(['a', 'd', 'b', 'c'])
  })

  it('leaves the order unchanged when the target equals the source', () => {
    expect(move(['a', 'b', 'c'], 1, 1)).toEqual(['a', 'b', 'c'])
  })

  it('moves to the end when the target is past it', () => {
    expect(move(['a', 'b', 'c'], 0, 9)).toEqual(['b', 'c', 'a'])
  })

  it('returns a copy unchanged for an out-of-range source', () => {
    expect(move(['a', 'b'], 5, 0)).toEqual(['a', 'b'])
    expect(move(['a', 'b'], -1, 0)).toEqual(['a', 'b'])
  })

  it('does not mutate the input', () => {
    const original = ['a', 'b', 'c']

    move(original, 0, 2)

    expect(original).toEqual(['a', 'b', 'c'])
  })

  it('returns an empty array for an empty input', () => {
    expect(move([], 0, 0)).toEqual([])
  })
})

describe('insertAt', () => {
  it('inserts at the given index', () => {
    expect(insertAt(['a', 'c'], 1, 'b')).toEqual(['a', 'b', 'c'])
  })

  it('inserts at the front', () => {
    expect(insertAt(['b'], 0, 'a')).toEqual(['a', 'b'])
  })

  it('appends when the index is past the end', () => {
    expect(insertAt(['a'], 9, 'b')).toEqual(['a', 'b'])
  })

  it('counts a negative index from the end', () => {
    expect(insertAt(['a', 'b', 'c'], -1, 'x')).toEqual(['a', 'b', 'x', 'c'])
  })

  it('does not mutate the input', () => {
    const original = ['a']

    insertAt(original, 0, 'b')

    expect(original).toEqual(['a'])
  })
})

describe('removeAt', () => {
  it('removes the item at the index', () => {
    expect(removeAt(['a', 'b', 'c'], 1)).toEqual(['a', 'c'])
  })

  it('closes the gap rather than leaving a hole', () => {
    const result = removeAt(['a', 'b', 'c'], 0)

    expect(result).toEqual(['b', 'c'])
    expect(result).toHaveLength(2)
  })

  it('returns a copy unchanged for an out-of-range index', () => {
    expect(removeAt(['a'], 3)).toEqual(['a'])
    expect(removeAt(['a'], -1)).toEqual(['a'])
  })

  it('does not mutate the input', () => {
    const original = ['a', 'b']

    removeAt(original, 0)

    expect(original).toEqual(['a', 'b'])
  })
})

describe('unique', () => {
  it('keeps the first occurrence of each value', () => {
    expect(unique(['a', 'b', 'a', 'c', 'b'])).toEqual(['a', 'b', 'c'])
  })

  it('leaves an already-unique array unchanged', () => {
    expect(unique([1, 2, 3])).toEqual([1, 2, 3])
  })

  it('compares by identity, so two equal objects both survive', () => {
    const a = { id: 1 }
    const b = { id: 1 }

    expect(unique([a, b, a])).toEqual([a, b])
  })

  it('returns an empty array for an empty input', () => {
    expect(unique([])).toEqual([])
  })
})

describe('groupBy', () => {
  it('groups by the derived key', () => {
    const groups = groupBy(['apple', 'avocado', 'beet'], (item) => item[0])

    expect(groups.get('a')).toEqual(['apple', 'avocado'])
    expect(groups.get('b')).toEqual(['beet'])
  })

  it('preserves input order within a group', () => {
    const groups = groupBy([3, 1, 4, 1, 5], (n) => (n % 2 === 0 ? 'even' : 'odd'))

    expect(groups.get('odd')).toEqual([3, 1, 1, 5])
  })

  it('returns an empty map for an empty input', () => {
    expect(groupBy([], () => 'k').size).toBe(0)
  })

  it('does not collide with Object.prototype keys, which is why it returns a Map', () => {
    const groups = groupBy(['x'], () => '__proto__')

    expect(groups.get('__proto__')).toEqual(['x'])
    expect(groups.size).toBe(1)
  })

  it('groups by a non-string key', () => {
    const groups = groupBy([1, 2, 3, 4], (n) => n % 2 === 0)

    expect(groups.get(true)).toEqual([2, 4])
    expect(groups.get(false)).toEqual([1, 3])
  })
})

describe('partition', () => {
  it('splits into matching and the rest', () => {
    expect(partition([1, 2, 3, 4], (n) => n % 2 === 0)).toEqual([
      [2, 4],
      [1, 3],
    ])
  })

  it('puts everything in the first array when all match', () => {
    expect(partition([2, 4], (n) => n % 2 === 0)).toEqual([[2, 4], []])
  })

  it('puts everything in the second array when none match', () => {
    expect(partition([1, 3], (n) => n % 2 === 0)).toEqual([[], [1, 3]])
  })

  it('preserves input order in both halves', () => {
    expect(partition(['c', 'a', 'd', 'b'], (s) => s < 'c')).toEqual([
      ['a', 'b'],
      ['c', 'd'],
    ])
  })

  it('returns two empty arrays for an empty input', () => {
    expect(partition([], () => true)).toEqual([[], []])
  })
})
