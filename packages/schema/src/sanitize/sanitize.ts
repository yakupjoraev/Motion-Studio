import type { Asset, MotionDocument, Node } from '../document/document.types'
import type { NodeId } from '../ids/ids'

import { validateCssDeclarations } from './css/validate-css'
import { sanitizeRichText } from './rich-text'
import { MAX_BLUR_DATA_URL_BYTES, checkImageDataUrl, isSafeUrl } from './urls'

/**
 * FILE_FORMAT.md § Security, one row per kind. A `.motion` file is untrusted input and this is a
 * client app, so the threat is XSS through rendered content.
 *
 * Which policy a prop gets is decided by its **name**, because the alternative — asking the block's
 * schema — would make this pass depend on the registry, and sanitisation has to run on a file whose
 * blocks may not be registered at all. Names come from the control kinds in COMPONENT_LIBRARY.md, so
 * a block that calls its link `href` and its escape hatch `css` is following the same table this is.
 */
export const REMOVAL_KINDS = {
  unsafeUrl: 'UNSAFE_URL',
  unsafeDataUrl: 'UNSAFE_DATA_URL',
  blockedCss: 'BLOCKED_CSS',
  strippedMarkup: 'STRIPPED_MARKUP',
  truncated: 'TRUNCATED',
  blurDataUrl: 'BLUR_DATA_URL',
} as const

export type RemovalKind = (typeof REMOVAL_KINDS)[keyof typeof REMOVAL_KINDS]

export interface Removal {
  readonly kind: RemovalKind
  /** Dotted path from the document root: `nodes.node_1.props.href`. */
  readonly path: string
  readonly message: string
}

export interface SanitizeOutcome {
  readonly document: MotionDocument
  readonly removed: readonly Removal[]
}

/** § Density of the rest of the format: a name is a label, not a payload. */
export const MAX_NAME_LENGTH = 80
export const MAX_TEXT_LENGTH = 20_000

const URL_KEYS = new Set(['href', 'src', 'url', 'poster', 'action', 'link', 'image', 'video'])
const CSS_KEYS = /(^|[a-z])css$|^style$/i
const RICH_TEXT_KEYS = /(^|[a-z])(html|richText|richtext)$/i

// biome-ignore lint/suspicious/noControlCharactersInRegex: matching control characters is the point
const CONTROL_RE = /[\u0000-\u001f\u007f]/g

const stripControl = (value: string): string => value.replace(CONTROL_RE, '')

class Report {
  readonly removed: Removal[] = []

  add(kind: RemovalKind, path: string, message: string): void {
    this.removed.push({ kind, path, message })
  }
}

function sanitizeString(key: string, value: string, path: string, report: Report): string {
  if (URL_KEYS.has(key)) {
    if (isSafeUrl(value)) {
      return value
    }

    report.add(REMOVAL_KINDS.unsafeUrl, path, `${key} used a scheme that is not allowed`)

    return ''
  }

  if (CSS_KEYS.test(key)) {
    // The same validator the playground and the inspector call — ADR-265. A second implementation
    // here would be the one nobody looks at, and this is the path that runs on untrusted input.
    const validated = validateCssDeclarations(value)

    if (validated.ok) {
      return validated.normalized
    }

    report.add(
      REMOVAL_KINDS.blockedCss,
      path,
      validated.errors.map((error) => `line ${error.line}: ${error.message}`).join(' '),
    )

    return ''
  }

  if (RICH_TEXT_KEYS.test(key)) {
    const cleaned = sanitizeRichText(value)

    if (cleaned !== value) {
      report.add(
        REMOVAL_KINDS.strippedMarkup,
        path,
        'Markup outside bold, italic, code and links was removed',
      )
    }

    return cleaned
  }

  const stripped = stripControl(value)

  if (stripped.length > MAX_TEXT_LENGTH) {
    report.add(
      REMOVAL_KINDS.truncated,
      path,
      `A text value over ${MAX_TEXT_LENGTH} characters was cut`,
    )

    return stripped.slice(0, MAX_TEXT_LENGTH)
  }

  return stripped
}

/** Props nest — a list control holds objects — so the walk is recursive and carries the key with it. */
function sanitizeValue(key: string, value: unknown, path: string, report: Report): unknown {
  if (typeof value === 'string') {
    return sanitizeString(key, value, path, report)
  }

  if (Array.isArray(value)) {
    return value.map((entry, index) => sanitizeValue(key, entry, `${path}.${index}`, report))
  }

  if (typeof value === 'object' && value !== null) {
    const result: Record<string, unknown> = {}

    for (const [childKey, childValue] of Object.entries(value)) {
      result[childKey] = sanitizeValue(childKey, childValue, `${path}.${childKey}`, report)
    }

    return result
  }

  return value
}

const sanitizeRecord = (
  record: Readonly<Record<string, unknown>>,
  path: string,
  report: Report,
): Record<string, unknown> => sanitizeValue('', record, path, report) as Record<string, unknown>

function sanitizeNode(node: Node, report: Report): Node {
  const path = `nodes.${node.id}`
  const name = stripControl(node.name)

  if (name.length > MAX_NAME_LENGTH) {
    report.add(
      REMOVAL_KINDS.truncated,
      `${path}.name`,
      `A node name over ${MAX_NAME_LENGTH} characters was cut`,
    )
  }

  const responsive: Record<string, Record<string, unknown>> = {}

  for (const [breakpoint, overrides] of Object.entries(node.responsive)) {
    if (overrides !== undefined) {
      responsive[breakpoint] = sanitizeRecord(overrides, `${path}.responsive.${breakpoint}`, report)
    }
  }

  return {
    ...node,
    name: name.slice(0, MAX_NAME_LENGTH),
    props: sanitizeRecord(node.props, `${path}.props`, report),
    responsive: responsive as Node['responsive'],
    effects: node.effects.map((effect) => ({
      ...effect,
      params: sanitizeRecord(effect.params, `${path}.effects.${effect.id}.params`, report),
    })),
  }
}

function sanitizeAsset(asset: Asset, report: Report): Asset {
  const path = `assets.${asset.id}`
  const source = asset.source

  let checked = source

  if (source.type === 'url') {
    if (!isSafeUrl(source.url)) {
      report.add(
        REMOVAL_KINDS.unsafeUrl,
        `${path}.source`,
        'An asset URL used a scheme that is not allowed',
      )
      checked = { type: 'url', url: '' }
    }
  } else {
    const result = checkImageDataUrl(source.dataUrl)

    if (!result.ok) {
      report.add(
        REMOVAL_KINDS.unsafeDataUrl,
        `${path}.source`,
        `An inline asset was dropped: ${result.reason ?? 'invalid'}`,
      )
      checked = { type: 'data', dataUrl: '' }
    }
  }

  const blur = asset.blurDataUrl

  if (blur !== undefined && !checkImageDataUrl(blur, MAX_BLUR_DATA_URL_BYTES).ok) {
    report.add(
      REMOVAL_KINDS.blurDataUrl,
      `${path}.blurDataUrl`,
      'A blur placeholder was not a small image data URL',
    )

    const { blurDataUrl: _dropped, ...rest } = asset

    return { ...rest, source: checked, alt: stripControl(asset.alt) }
  }

  return { ...asset, source: checked, alt: stripControl(asset.alt) }
}

/** One pass, returning what it changed. Silent sanitisation is what makes an import report a lie. */
export function sanitizeDocument(document: MotionDocument): SanitizeOutcome {
  const report = new Report()
  const nodes: Record<string, Node> = {}
  const assets: Record<string, Asset> = {}

  for (const [id, node] of Object.entries(document.nodes)) {
    nodes[id] = sanitizeNode(node, report)
  }

  for (const [id, asset] of Object.entries(document.assets)) {
    assets[id] = sanitizeAsset(asset, report)
  }

  return {
    document: {
      ...document,
      meta: { ...document.meta, name: stripControl(document.meta.name).slice(0, 120) },
      nodes: nodes as Readonly<Record<NodeId, Node>>,
      assets: assets as MotionDocument['assets'],
    },
    removed: report.removed,
  }
}
