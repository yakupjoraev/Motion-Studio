import { doc, fixtureBlockId, node, resolveResponsiveProps } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { capturePatches, codeOf, harness, id } from '../test/harness'

import { COMMAND_CODES } from './guards'
import { setResponsiveProp } from './set-responsive-prop'

const cardDocument = (): ReturnType<typeof doc> =>
  doc([
    node({ id: id('root'), slot: 'root', children: [id('a')] }),
    node({
      id: id('a'),
      blockId: fixtureBlockId('card'),
      parentId: id('root'),
      props: { columns: 1, title: '' },
    }),
  ])

describe('setResponsiveProp', () => {
  it('writes the override at the breakpoint and leaves the base alone', () => {
    const harnessed = harness({ document: cardDocument() })

    harnessed.store
      .getState()
      .dispatch(setResponsiveProp({ nodeId: id('a'), breakpoint: 'md', path: 'columns', value: 3 }))

    const written = harnessed.document().nodes[id('a')]

    expect(written?.responsive).toEqual({ md: { columns: 3 } })
    expect(written?.props['columns']).toBe(1)
    expect(resolveResponsiveProps(written ?? node(), 'lg')).toEqual({ columns: 3, title: '' })
  })

  it('writes one patch into the breakpoint record', () => {
    const harnessed = harness({ document: cardDocument() })

    expect(
      capturePatches(
        harnessed,
        setResponsiveProp({ nodeId: id('a'), breakpoint: 'md', path: 'columns', value: 3 }),
      ),
    ).toEqual([{ op: 'add', path: ['nodes', id('a'), 'responsive', 'md'], value: { columns: 3 } }])
  })

  it('rejects the base breakpoint, which is the prop itself', () => {
    const harnessed = harness({ document: cardDocument() })

    expect(
      codeOf(() =>
        harnessed.store
          .getState()
          .dispatch(
            setResponsiveProp({ nodeId: id('a'), breakpoint: 'base', path: 'columns', value: 3 }),
          ),
      ),
    ).toBe(COMMAND_CODES.baseIsNotAnOverride)
  })

  it('rejects a nested path, which the shallow merge could not resolve', () => {
    const harnessed = harness({ document: cardDocument() })

    expect(
      codeOf(() =>
        harnessed.store
          .getState()
          .dispatch(
            setResponsiveProp({ nodeId: id('a'), breakpoint: 'md', path: 'padding.top', value: 8 }),
          ),
      ),
    ).toBe(COMMAND_CODES.responsivePathNotShallow)
  })

  it('rejects an override the block schema would refuse at that breakpoint', () => {
    const harnessed = harness({ document: cardDocument() })

    expect(
      codeOf(() =>
        harnessed.store
          .getState()
          .dispatch(
            setResponsiveProp({ nodeId: id('a'), breakpoint: 'md', path: 'columns', value: 99 }),
          ),
      ),
    ).toBe(COMMAND_CODES.invalidProps)
  })

  it('coalesces per node, breakpoint and path', () => {
    expect(
      setResponsiveProp({ nodeId: id('a'), breakpoint: 'md', path: 'columns', value: 3 })
        .coalesceKey,
    ).toBe(`set-rprop:${id('a')}:md:columns`)
  })
})
