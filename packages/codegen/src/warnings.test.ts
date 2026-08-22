import { nodeId } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { DEFAULT_EXPORT_OPTIONS, resolveOptions } from './options.types'
import { WARNING_CODES, WARNING_DOCS, warning } from './warnings'

describe('the warning catalogue', () => {
  it('carries the seven categories EXPORT_ENGINE.md lists', () => {
    expect([...WARNING_CODES]).toEqual([
      'approximation',
      'missing-alt',
      'contrast',
      'unsupported',
      'dependency',
      'perf',
      'a11y',
    ])
  })

  it('links every code to a document, because a warning nobody can act on trains nobody', () => {
    for (const code of WARNING_CODES) {
      expect(WARNING_DOCS[code]).toMatch(/^docs\/[A-Z_]+\.md/)
    }
  })

  it('attaches the node when one is named and omits the key when none is', () => {
    const withNode = warning('missing-alt', 'No alt text.', nodeId('node_1'))
    const without = warning('perf', 'Six blurs.')

    expect(withNode.nodeId).toBe('node_1')
    expect('nodeId' in without).toBe(false)
  })
})

describe('resolveOptions', () => {
  it('answers with the dialog defaults when nothing is passed', () => {
    expect(resolveOptions()).toEqual(DEFAULT_EXPORT_OPTIONS)
  })

  it('overrides only the fields given', () => {
    const options = resolveOptions({ singleFile: true })

    expect(options.singleFile).toBe(true)
    expect(options.target).toBe(DEFAULT_EXPORT_OPTIONS.target)
  })
})
