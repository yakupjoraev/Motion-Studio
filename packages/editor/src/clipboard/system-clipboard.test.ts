import { doc, tree } from '@motion-studio/schema'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { id } from '../test/harness'

import { serializeSubtree } from './serialize-subtree'
import {
  CLIPBOARD_MARKER,
  decodeClipboardText,
  encodeClipboardText,
  readSystemClipboard,
  writeSystemClipboard,
} from './system-clipboard'

const subtree = (): ReturnType<typeof serializeSubtree> =>
  serializeSubtree(doc(tree({ root: ['a'] })), [id('a')])

/** The shape the browser exposes, narrowed to what this module calls. */
const stubClipboard = (clipboard: Partial<Clipboard> | undefined): void => {
  vi.stubGlobal('navigator', clipboard === undefined ? {} : { clipboard })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('system clipboard', () => {
  it('writes the marker in front of readable JSON', () => {
    const text = encodeClipboardText(subtree())

    expect(text.startsWith(CLIPBOARD_MARKER)).toBe(true)
    expect(JSON.parse(text.slice(CLIPBOARD_MARKER.length))).toMatchObject({ version: 1 })
  })

  it('recognises its own payload and nothing else', () => {
    const text = encodeClipboardText(subtree())

    expect(decodeClipboardText(text)).not.toBeNull()
    expect(decodeClipboardText(`  \n  ${text}`)).not.toBeNull()
    expect(decodeClipboardText('const hello = 1')).toBeNull()
  })

  it('writes through the system clipboard when it is there', async () => {
    const writeText = vi.fn(async () => undefined)

    stubClipboard({ writeText })

    expect(await writeSystemClipboard('payload')).toBe(true)
    expect(writeText).toHaveBeenCalledWith('payload')
  })

  it('reports a write failure instead of throwing', async () => {
    stubClipboard({
      writeText: vi.fn(async () => {
        throw new Error('Write permission denied')
      }),
    })

    expect(await writeSystemClipboard('payload')).toBe(false)
  })

  it('reports no clipboard API as a failed write and an empty read', async () => {
    stubClipboard(undefined)

    expect(await writeSystemClipboard('payload')).toBe(false)
    expect(await readSystemClipboard()).toBeNull()
  })

  it('reads what is there, and null when reading is denied', async () => {
    stubClipboard({ readText: vi.fn(async () => 'from another tab') })

    expect(await readSystemClipboard()).toBe('from another tab')

    stubClipboard({
      readText: vi.fn(async () => {
        throw new Error('Read permission denied')
      }),
    })

    expect(await readSystemClipboard()).toBeNull()
  })
})
