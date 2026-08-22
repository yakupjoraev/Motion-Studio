import {
  type Asset,
  type MotionDocument,
  type Node,
  assetId,
  blockId,
  nodeId,
} from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { type ExportOptions, resolveOptions } from '../../options.types'
import { fixtureRegistry } from '../../test/blocks'
import { document } from '../../test/documents'
import { createAssetCollector } from './handle-assets'

const registry = fixtureRegistry()

const PNG = 'data:image/png;base64,aaaabbbbcccc'

const imageNode = (props: Record<string, unknown>): Node => ({
  id: nodeId('node_img'),
  blockId: blockId('image'),
  name: 'Screenshot',
  parentId: null,
  slot: 'root',
  children: [],
  props,
  responsive: {},
  motion: {},
  effects: [],
  locked: false,
  hidden: false,
})

const stored = (source: Asset['source'], overrides: Partial<Asset> = {}): MotionDocument =>
  document(
    { id: 'node_root', block: 'page' },
    {
      assets: {
        [assetId('asset_one')]: {
          id: assetId('asset_one'),
          kind: 'image',
          source,
          width: 1600,
          height: 1000,
          alt: 'The studio canvas',
          ...overrides,
        },
      } as MotionDocument['assets'],
    },
  )

const collect = (
  node: Node,
  overrides: Partial<ExportOptions> = {},
  source: MotionDocument = document({ id: 'node_root', block: 'page' }),
) => {
  const collector = createAssetCollector(source, resolveOptions(overrides))
  const result = collector.collect(node, registry.require(blockId('image')))

  return { result, warnings: collector.warnings, assets: collector.assets }
}

describe("assets: 'reference'", () => {
  it('keeps the original URL', () => {
    const { result } = collect(
      imageNode({ src: 'https://cdn.example.com/a.png', alt: 'A', width: 800, height: 600 }),
    )

    expect(result.assets[0]?.src).toBe('https://cdn.example.com/a.png')
  })
})

describe("assets: 'inline'", () => {
  it('keeps a data URL and records its size', () => {
    const { result } = collect(imageNode({ src: PNG, alt: 'A' }), { assets: 'inline' })

    expect(result.assets[0]?.src).toBe(PNG)
    expect(result.assets[0]?.bytes).toBe(PNG.length)
  })

  it('reports a remote URL it cannot inline without fetching it', () => {
    const { warnings } = collect(imageNode({ src: 'https://cdn.example.com/a.png', alt: 'A' }), {
      assets: 'inline',
    })

    expect(warnings[0]?.code).toBe('unsupported')
  })

  it('warns once the base64 total passes the budget', () => {
    const big = `data:image/png;base64,${'a'.repeat(210 * 1024)}`
    const { warnings } = collect(imageNode({ src: big, alt: 'A' }), { assets: 'inline' })

    expect(warnings.filter((entry) => entry.code === 'perf')).toHaveLength(1)
  })
})

describe("assets: 'bundle'", () => {
  it('rewrites the path and says where the file goes', () => {
    const { result } = collect(imageNode({ src: 'https://cdn.example.com/a.webp', alt: 'A' }), {
      assets: 'bundle',
    })

    expect(result.assets[0]?.src).toMatch(/^\/asset_\w+\.webp$/)
    expect(result.assets[0]?.bundlePath).toMatch(/^public\/asset_\w+\.webp$/)
  })

  it('reads the extension from a data URL when there is no path to read', () => {
    const { result } = collect(imageNode({ src: PNG, alt: 'A' }), { assets: 'bundle' })

    expect(result.assets[0]?.bundlePath?.endsWith('.png')).toBe(true)
  })
})

describe('the image component', () => {
  it("prints next/image with sizes and the block's own value", () => {
    const { result } = collect(
      imageNode({ src: PNG, alt: 'A', width: 800, height: 600, sizes: '(min-width: 768px) 50vw' }),
    )

    expect(result.tag).toBe('Image')
    expect(result.imports).toEqual([{ from: 'next/image', default: 'Image' }])
    expect(result.attributes['sizes']).toEqual({
      kind: 'literal',
      value: '(min-width: 768px) 50vw',
    })
  })

  it('prints the blur placeholder when the asset record carries one', () => {
    const source = stored(
      { type: 'data', dataUrl: PNG },
      { blurDataUrl: 'data:image/png;base64,z' },
    )
    const { result } = collect(imageNode({ src: PNG }), {}, source)

    expect(result.attributes['placeholder']).toEqual({ kind: 'literal', value: 'blur' })
    expect(result.attributes['blurDataURL']).toEqual({
      kind: 'literal',
      value: 'data:image/png;base64,z',
    })
  })

  it('prints a plain img with the loading hints instead', () => {
    const { result } = collect(imageNode({ src: PNG, alt: 'A', width: 800, height: 600 }), {
      imageComponent: 'img',
    })

    expect(result.tag).toBeUndefined()
    expect(result.imports).toEqual([])
    expect(result.attributes['loading']).toEqual({ kind: 'literal', value: 'lazy' })
    expect(result.attributes['decoding']).toEqual({ kind: 'literal', value: 'async' })
  })

  it('reserves the box from the asset record over the props', () => {
    const source = stored({ type: 'data', dataUrl: PNG })
    const { result } = collect(imageNode({ src: PNG, width: 10, height: 10 }), {}, source)

    expect(result.attributes['width']).toEqual({ kind: 'literal', value: 1600 })
    expect(result.attributes['alt']).toEqual({ kind: 'literal', value: 'The studio canvas' })
  })
})

describe('alt text', () => {
  it('warns rather than shipping a silent empty string', () => {
    const { warnings } = collect(imageNode({ src: PNG, alt: '', width: 8, height: 8 }))

    expect(warnings[0]?.code).toBe('missing-alt')
    expect(warnings[0]?.nodeId).toBe('node_img')
  })

  it('says nothing when the description is there', () => {
    const { warnings } = collect(imageNode({ src: PNG, alt: 'A', width: 8, height: 8 }))

    expect(warnings).toEqual([])
  })
})

describe('a block with no image', () => {
  it('collects nothing when the source prop is empty', () => {
    const { assets, warnings } = collect(imageNode({ src: '', alt: '' }))

    expect(assets).toEqual([])
    expect(warnings).toEqual([])
  })

  it('collects nothing when the block declares no image control', () => {
    const collector = createAssetCollector(
      document({ id: 'node_root', block: 'page' }),
      resolveOptions(),
    )
    const result = collector.collect(
      { ...imageNode({ src: PNG }), blockId: blockId('section') },
      registry.require(blockId('section')),
    )

    expect(result.assets).toEqual([])
  })
})
