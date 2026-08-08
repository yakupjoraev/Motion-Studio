import { beforeEach, describe, expect, it } from 'vitest'

import type { Asset, MotionDocument } from '../document/document.types'
import { assetId, nodeId } from '../ids/ids'
import { doc, node, resetFactories } from '../test/factories'

import {
  MALICIOUS_CSS,
  MALICIOUS_RICH_TEXT,
  MALICIOUS_URLS,
  OVERSIZED,
  SAFE_URLS,
} from './__fixtures__/malicious'
import { sanitizeRichText } from './rich-text'
import { MAX_NAME_LENGTH, REMOVAL_KINDS, sanitizeDocument } from './sanitize'
import { checkImageDataUrl, isSafeUrl } from './urls'

const withProps = (props: Record<string, unknown>): MotionDocument =>
  doc([node({ id: nodeId('node_1'), props })], { rootId: nodeId('node_1') })

const asset = (overrides: Partial<Asset>): MotionDocument =>
  doc([node({ id: nodeId('node_1') })], {
    rootId: nodeId('node_1'),
    assets: {
      asset_1: {
        id: assetId('asset_1'),
        kind: 'image',
        source: { type: 'url', url: 'https://images.example.com/a.webp' },
        width: 100,
        height: 100,
        alt: 'A',
        ...overrides,
      },
    } as MotionDocument['assets'],
  })

beforeEach(() => {
  resetFactories()
})

describe('URLs', () => {
  it.each(Object.entries(MALICIOUS_URLS))('strips the %s payload and reports it', (_label, url) => {
    const outcome = sanitizeDocument(withProps({ href: url }))

    expect(outcome.document.nodes[nodeId('node_1')]?.props['href']).toBe('')
    expect(outcome.removed.map((entry) => entry.kind)).toContain(REMOVAL_KINDS.unsafeUrl)
  })

  it.each(Object.entries(SAFE_URLS))('keeps the %s fixture untouched', (_label, url) => {
    const outcome = sanitizeDocument(withProps({ href: url }))

    expect(outcome.document.nodes[nodeId('node_1')]?.props['href']).toBe(url)
    expect(outcome.removed).toEqual([])
  })

  it('names the path it removed something from', () => {
    const outcome = sanitizeDocument(withProps({ href: MALICIOUS_URLS.javascript }))

    expect(outcome.removed[0]?.path).toBe('nodes.node_1.props.href')
  })

  it('reaches a URL nested inside a list prop', () => {
    const outcome = sanitizeDocument(
      withProps({ items: [{ label: 'One', href: MALICIOUS_URLS.javascript }] }),
    )

    expect(outcome.removed[0]?.path).toBe('nodes.node_1.props.items.0.href')
  })
})

describe('CSS escape hatches', () => {
  it.each(Object.entries(MALICIOUS_CSS))('drops the %s payload and reports it', (_label, css) => {
    const outcome = sanitizeDocument(withProps({ customCss: css }))

    expect(outcome.document.nodes[nodeId('node_1')]?.props['customCss']).toBe('')
    expect(outcome.removed.map((entry) => entry.kind)).toContain(REMOVAL_KINDS.blockedCss)
  })

  it('keeps a value the validator accepts', () => {
    const outcome = sanitizeDocument(withProps({ css: '0 1px 2px rgb(0 0 0 / 40%)' }))

    expect(outcome.removed).toEqual([])
  })
})

describe('rich text', () => {
  it.each(Object.entries(MALICIOUS_RICH_TEXT))('neutralises the %s payload', (_label, html) => {
    const cleaned = sanitizeRichText(html)

    expect(cleaned).not.toMatch(/<script|<iframe|<img|onerror|javascript:/i)
  })

  it('keeps the text inside a tag it removes', () => {
    expect(sanitizeRichText(MALICIOUS_RICH_TEXT.nestedUnknown)).toBe('<strong>deep</strong>')
  })

  it('drops the content of a script, because that content is code', () => {
    expect(sanitizeRichText(MALICIOUS_RICH_TEXT.script)).toBe('Hello  world')
  })

  it('keeps a safe link and drops an unsafe one, keeping its text', () => {
    expect(sanitizeRichText('<a href="https://example.com">x</a>')).toBe(
      '<a href="https://example.com">x</a>',
    )
    expect(sanitizeRichText(MALICIOUS_RICH_TEXT.javascriptLink)).toBe('click')
  })

  it('closes what a truncated document left open', () => {
    expect(sanitizeRichText(MALICIOUS_RICH_TEXT.unclosed)).toBe('<strong>bold</strong>')
  })

  it('escapes text so a stripped tag cannot reappear', () => {
    expect(sanitizeRichText('a < b & c')).toBe('a &lt; b &amp; c')
  })

  it('reports on a document whose rich text was changed', () => {
    const outcome = sanitizeDocument(withProps({ bodyHtml: MALICIOUS_RICH_TEXT.script }))

    expect(outcome.removed.map((entry) => entry.kind)).toContain(REMOVAL_KINDS.strippedMarkup)
  })
})

describe('assets', () => {
  it('drops a data URL past the size cap', () => {
    const outcome = sanitizeDocument(
      asset({ source: { type: 'data', dataUrl: OVERSIZED.dataUrl } }),
    )

    expect(outcome.removed.map((entry) => entry.kind)).toContain(REMOVAL_KINDS.unsafeDataUrl)
  })

  it('drops a data URL whose type is not an allowed image', () => {
    expect(checkImageDataUrl(OVERSIZED.wrongType)).toEqual({ ok: false, reason: 'type' })
  })

  it('drops an oversized blur placeholder and keeps the asset', () => {
    const outcome = sanitizeDocument(asset({ blurDataUrl: OVERSIZED.blurDataUrl }))

    expect(outcome.removed.map((entry) => entry.kind)).toContain(REMOVAL_KINDS.blurDataUrl)
    expect(outcome.document.assets[assetId('asset_1')]?.blurDataUrl).toBeUndefined()
    expect(outcome.document.assets[assetId('asset_1')]).toBeDefined()
  })

  it('keeps a small, correctly typed blur placeholder', () => {
    const outcome = sanitizeDocument(asset({ blurDataUrl: 'data:image/webp;base64,UklGRg==' }))

    expect(outcome.removed).toEqual([])
  })

  it('blanks an asset URL with a scheme that is not allowed', () => {
    const outcome = sanitizeDocument(
      asset({ source: { type: 'url', url: MALICIOUS_URLS.javascript } }),
    )

    expect(outcome.removed.map((entry) => entry.kind)).toContain(REMOVAL_KINDS.unsafeUrl)
  })
})

describe('names and text', () => {
  it('cuts a 100 kB node name and reports it', () => {
    const document = doc([node({ id: nodeId('node_1'), name: OVERSIZED.nodeName })], {
      rootId: nodeId('node_1'),
    })

    const outcome = sanitizeDocument(document)

    expect(outcome.document.nodes[nodeId('node_1')]?.name).toHaveLength(MAX_NAME_LENGTH)
    expect(outcome.removed.map((entry) => entry.kind)).toContain(REMOVAL_KINDS.truncated)
  })

  it('strips control characters from a text prop', () => {
    const outcome = sanitizeDocument(withProps({ title: 'a\u0007b\u001fc' }))

    expect(outcome.document.nodes[nodeId('node_1')]?.props['title']).toBe('abc')
  })

  it('leaves an ordinary document untouched and reports nothing', () => {
    const document = withProps({ title: 'Ship faster', columns: 3, glass: true })
    const outcome = sanitizeDocument(document)

    expect(outcome.removed).toEqual([])
    expect(outcome.document.nodes[nodeId('node_1')]?.props).toEqual({
      title: 'Ship faster',
      columns: 3,
      glass: true,
    })
  })

  it('sanitises responsive overrides as well as base props', () => {
    const document = doc(
      [
        node({
          id: nodeId('node_1'),
          responsive: { md: { href: MALICIOUS_URLS.javascript } },
        }),
      ],
      { rootId: nodeId('node_1') },
    )

    expect(sanitizeDocument(document).removed[0]?.path).toBe('nodes.node_1.responsive.md.href')
  })
})

describe('isSafeUrl', () => {
  it('accepts a bare path with a colon nowhere near a scheme position', () => {
    expect(isSafeUrl('/a/b?x=1:2')).toBe(true)
  })

  it('rejects an empty value', () => {
    expect(isSafeUrl('   ')).toBe(false)
  })
})
