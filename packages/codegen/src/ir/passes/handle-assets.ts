import type {
  Asset,
  BlockDefinition,
  ImportSpec,
  MotionDocument,
  Node,
} from '@motion-studio/schema'
import { getPath } from '@motion-studio/utils'

import { hash } from '../../hash'
import type { ExportOptions } from '../../options.types'
import { INLINE_ASSET_BUDGET, type IRWarning, warning } from '../../warnings'
import type { IRAsset, IRValue } from '../ir.types'

/**
 * Pass 6 — EXPORT_ENGINE.md § Asset handling. Three modes, and the element attributes each image
 * component needs.
 *
 * Which props are images is not guessed: the inspector already declares it, because a `kind: 'image'`
 * control is exactly "this prop holds a picture". One declaration serves the panel and the export.
 */
export interface AssetResult {
  /** The image element's tag, when the option and the descriptor agree on `next/image`. */
  readonly tag?: string
  readonly attributes: Readonly<Record<string, IRValue>>
  readonly imports: readonly ImportSpec[]
  readonly assets: readonly IRAsset[]
}

const EMPTY: AssetResult = { attributes: {}, imports: [], assets: [] }

/** The elements a block's own root can be, and therefore the ones asset attributes can land on. */
const MEDIA_TAGS = new Set(['img', 'video'])

const literal = (value: string | number | boolean): IRValue => ({ kind: 'literal', value })

/** `media.src` → `media.alt`. The description of a picture sits beside the picture. */
const sibling = (path: string, key: string): string => {
  const cut = path.lastIndexOf('.')

  return cut === -1 ? key : `${path.slice(0, cut + 1)}${key}`
}

const asString = (value: unknown): string | undefined =>
  typeof value === 'string' && value !== '' ? value : undefined

const asNumber = (value: unknown): number | undefined =>
  typeof value === 'number' && Number.isFinite(value) ? value : undefined

const extensionOf = (src: string): string => {
  const dataMatch = /^data:(image|video)\/([a-z0-9+]+);/i.exec(src)

  if (dataMatch !== null) {
    return dataMatch[2] === 'jpeg' ? 'jpg' : (dataMatch[2] ?? 'png')
  }

  const urlMatch = /\.([a-z0-9]{2,5})(?:[?#]|$)/i.exec(src)

  return urlMatch?.[1]?.toLowerCase() ?? 'png'
}

export interface AssetCollector {
  collect(node: Node, definition: BlockDefinition): AssetResult
  readonly assets: readonly IRAsset[]
  readonly warnings: readonly IRWarning[]
}

export function createAssetCollector(
  document: MotionDocument,
  options: ExportOptions,
): AssetCollector {
  const bySource = new Map<string, Asset>()

  for (const asset of Object.values(document.assets)) {
    bySource.set(asset.source.type === 'url' ? asset.source.url : asset.source.dataUrl, asset)
  }

  const assets: IRAsset[] = []
  const warnings: IRWarning[] = []
  let inlineBytes = 0

  /** EXPORT_ENGINE.md § Asset handling: three modes, and only one of them can rewrite a remote URL. */
  function sourceFor(raw: string, id: string): { src: string; bundlePath?: string; bytes: number } {
    const bytes = raw.startsWith('data:') ? raw.length : 0

    if (options.assets === 'inline') {
      if (bytes === 0) {
        warnings.push(
          warning(
            'unsupported',
            `'${raw}' is a remote URL and cannot be inlined without fetching it; it is exported as a reference.`,
          ),
        )

        return { src: raw, bytes: 0 }
      }

      inlineBytes += bytes

      if (inlineBytes > INLINE_ASSET_BUDGET && bytes > 0) {
        warnings.push(
          warning(
            'perf',
            `Inlined assets total ${Math.round(inlineBytes / 1024)} kB, over the ${
              INLINE_ASSET_BUDGET / 1024
            } kB the export budgets for base64.`,
          ),
        )
      }

      return { src: raw, bytes }
    }

    if (options.assets === 'bundle') {
      const file = `${id}.${extensionOf(raw)}`

      return { src: `/${file}`, bundlePath: `public/${file}`, bytes }
    }

    return { src: raw, bytes }
  }

  function collect(node: Node, definition: BlockDefinition): AssetResult {
    const paths = definition.controls
      .flatMap((group) => group.controls)
      .filter((control) => control.kind === 'image')
      .map((control) => control.path)

    if (paths.length === 0) {
      return EMPTY
    }

    const attributes: Record<string, IRValue> = {}
    const imports: ImportSpec[] = []
    const found: IRAsset[] = []
    const nextImage = definition.codegen.imports?.find((spec) => spec.from === 'next/image')
    const useNext = options.imageComponent === 'next-image' && nextImage?.default !== undefined
    let tag: string | undefined

    for (const path of paths) {
      const raw = asString(getPath(node.props, path))

      if (raw === undefined) {
        continue
      }

      const stored = bySource.get(raw)
      const alt = stored?.alt ?? asString(getPath(node.props, sibling(path, 'alt'))) ?? ''
      const id = stored?.id ?? `asset_${hash(raw)}`
      const placed = sourceFor(raw, id)
      const blurDataUrl = stored?.blurDataUrl
      const asset: IRAsset = {
        id,
        kind: stored?.kind ?? (definition.codegen.tag === 'video' ? 'video' : 'image'),
        src: placed.src,
        width: stored?.width ?? asNumber(getPath(node.props, sibling(path, 'width'))) ?? 0,
        height: stored?.height ?? asNumber(getPath(node.props, sibling(path, 'height'))) ?? 0,
        alt,
        ...(blurDataUrl === undefined ? {} : { blurDataUrl }),
        ...(placed.bundlePath === undefined ? {} : { bundlePath: placed.bundlePath }),
        bytes: placed.bytes,
      }

      found.push(asset)
      assets.push(asset)

      if (alt === '') {
        // `imageNeedsAlt` in the image block's schema, restated: a set source with no description.
        warnings.push(warning('missing-alt', `The image at '${path}' has no alt text.`, node.id))
      }

      if (!MEDIA_TAGS.has(definition.codegen.tag)) {
        continue
      }

      const sizes = asString(getPath(node.props, sibling(path, 'sizes'))) ?? '100vw'

      Object.assign(attributes, mediaAttributes(asset, useNext, sizes))

      if (useNext && nextImage !== undefined) {
        tag = nextImage.default
        imports.push(nextImage)
      }
    }

    return {
      ...(tag === undefined ? {} : { tag }),
      attributes,
      imports,
      assets: found,
    }
  }

  return { collect, assets, warnings }
}

/**
 * `next/image` gets the blur placeholder and `sizes`; a plain `img` gets the loading hints. Both get
 * `width`, `height` and `alt`, which is what reserves the box and describes the picture.
 */
function mediaAttributes(
  asset: IRAsset,
  useNext: boolean,
  sizes: string,
): Readonly<Record<string, IRValue>> {
  const base: Record<string, IRValue> = {
    src: literal(asset.src),
    alt: literal(asset.alt),
    width: literal(asset.width),
    height: literal(asset.height),
  }

  if (!useNext) {
    return { ...base, loading: literal('lazy'), decoding: literal('async') }
  }

  return {
    ...base,
    sizes: literal(sizes),
    ...(asset.blurDataUrl === undefined
      ? {}
      : { placeholder: literal('blur'), blurDataURL: literal(asset.blurDataUrl) }),
  }
}
