import { type Command, commands } from '@motion-studio/editor'
import { nodeId } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { describeBatch, describeCommand } from './describe-command'

const node = nodeId('node_a3f2')

describe('describing a command for a crash report', () => {
  it('names the command and the prop path, which is what makes a report reproducible', () => {
    const command = commands.setProp({ nodeId: node, path: 'plans[2].price', value: 19 })

    expect(describeCommand(command)).toBe('setProp plans[2].price')
  })

  it('names the type alone when the payload has no path', () => {
    expect(describeCommand(commands.removeNodes({ ids: [node] }))).toBe('removeNodes')
  })

  /**
   * The leak this module exists to prevent: a label is written for the undo menu and quotes the
   * document, so a report that used it would carry the user's own words into a public issue.
   */
  it('never repeats the label, which may quote the document', () => {
    const rename = commands.renameNode({ nodeId: node, name: 'Acme launch — confidential' })

    expect(rename.label).toContain('Acme launch')
    expect(describeCommand(rename)).toBe('renameNode')
  })

  it('ignores a path that is not a string', () => {
    const odd = { type: 'oddCommand', label: 'Odd', payload: { path: 42 }, apply: () => {} }

    expect(describeCommand(odd as unknown as Command)).toBe('oddCommand')
  })
})

describe('describing a batch', () => {
  it('counts a batch of one kind, which is what a props reset looks like', () => {
    const batch = ['heading', 'body', 'align'].map((path) =>
      commands.setProp({ nodeId: node, path, value: null }),
    )

    expect(describeBatch(batch)).toBe('batch setProp ×3')
  })

  it('counts a mixed batch without listing it', () => {
    const batch = [
      commands.setProp({ nodeId: node, path: 'heading', value: 'x' }),
      commands.removeNodes({ ids: [node] }),
    ]

    expect(describeBatch(batch)).toBe('batch of 2 commands')
  })

  it('says so when a batch is empty rather than printing an empty count', () => {
    expect(describeBatch([])).toBe('batch of nothing')
  })
})
