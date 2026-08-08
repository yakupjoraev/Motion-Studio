import { doc, fixtureBlockId, node } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { capturePatches, codeOf, harness, id } from '../test/harness'

import { clearResponsiveProp } from './clear-responsive-prop'
import { COMMAND_CODES } from './guards'

const overridden = (): ReturnType<typeof doc> =>
  doc([
    node({ id: id('root'), slot: 'root', children: [id('a')] }),
    node({
      id: id('a'),
      blockId: fixtureBlockId('card'),
      parentId: id('root'),
      props: { columns: 1, title: '' },
      responsive: { md: { columns: 3, title: 'Wide' } },
    }),
  ])

describe('clearResponsiveProp', () => {
  it('deletes the key rather than writing the base value back', () => {
    const harnessed = harness({ document: overridden() })

    harnessed.store
      .getState()
      .dispatch(clearResponsiveProp({ nodeId: id('a'), breakpoint: 'md', path: 'columns' }))

    const written = harnessed.document().nodes[id('a')]

    expect(written?.responsive['md']).toEqual({ title: 'Wide' })
    expect(Object.keys(written?.responsive['md'] ?? {})).not.toContain('columns')
  })

  it('drops the breakpoint record once its last override is gone', () => {
    const harnessed = harness({ document: overridden() })
    const state = harnessed.store.getState()

    state.dispatch(clearResponsiveProp({ nodeId: id('a'), breakpoint: 'md', path: 'columns' }))
    state.dispatch(clearResponsiveProp({ nodeId: id('a'), breakpoint: 'md', path: 'title' }))

    expect(harnessed.document().nodes[id('a')]?.responsive).toEqual({})
  })

  it('writes nothing when there is no override to clear', () => {
    const harnessed = harness({ document: overridden() })

    expect(
      capturePatches(
        harnessed,
        clearResponsiveProp({ nodeId: id('a'), breakpoint: 'lg', path: 'columns' }),
      ),
    ).toEqual([])
  })

  it('rejects the base breakpoint and a nested path', () => {
    const harnessed = harness({ document: overridden() })

    expect(
      codeOf(() =>
        harnessed.store
          .getState()
          .dispatch(clearResponsiveProp({ nodeId: id('a'), breakpoint: 'base', path: 'columns' })),
      ),
    ).toBe(COMMAND_CODES.baseIsNotAnOverride)
    expect(
      codeOf(() =>
        harnessed.store
          .getState()
          .dispatch(
            clearResponsiveProp({ nodeId: id('a'), breakpoint: 'md', path: 'padding.top' }),
          ),
      ),
    ).toBe(COMMAND_CODES.responsivePathNotShallow)
  })
})
