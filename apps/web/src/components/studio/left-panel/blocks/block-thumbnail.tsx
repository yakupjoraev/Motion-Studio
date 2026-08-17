'use client'

import { ICON_NAMES, ICON_REGISTRY, type IconComponent, type IconName } from '@motion-studio/icons'
import { useReducedMotion } from '@motion-studio/motion'
import type { BlockDefinition } from '@motion-studio/schema'
import { useColorMode } from '@motion-studio/theme'
import type { ColorMode } from '@motion-studio/tokens'
import Image from 'next/image'

import { useStudioStore } from '../../../../store/editor-store'

import manifest from '../../../../../public/thumbnails/thumbnails.json'

/** COMPONENT_LIBRARY.md § Thumbnails: `320 × 200` per colour mode, plus the hover clip when one exists. */
interface ThumbnailImage {
  readonly src: string
  readonly width: number
  readonly height: number
  readonly blurDataUrl: string
}

interface ThumbnailEntry {
  readonly dark: ThumbnailImage
  readonly light: ThumbnailImage
  /** PERFORMANCE.md § Images: WebM, one per mode, generated beside the stills. */
  readonly clip?: { readonly dark: string; readonly light: string }
}

const THUMBNAILS: Readonly<Record<string, ThumbnailEntry | undefined>> = manifest

const KNOWN_ICONS: ReadonlySet<string> = new Set(ICON_NAMES)

/** A block's icon is a name in its definition; a name the set does not have falls back to the generic card. */
const iconFor = (name: string): IconComponent =>
  KNOWN_ICONS.has(name) ? ICON_REGISTRY[name as IconName] : ICON_REGISTRY.card

/**
 * The card's picture. Fixed height rather than the source's aspect ratio, because the grid is
 * virtualized and PERFORMANCE.md § Virtualization allows no measured row: the file is exactly
 * `320 × 200`, so `width`/`height` are honest and the box it is drawn in is the panel's business.
 */
export const THUMBNAIL_HEIGHT_PX = 72

const SURFACE_CLASS =
  'relative block w-full overflow-hidden rounded-xs border border-border/60 bg-surface-0'

export interface BlockThumbnailProps {
  readonly definition: BlockDefinition
  /** The card owns the pointer. The clip exists while it is hovered and not one moment before. */
  readonly hovered: boolean
}

export function BlockThumbnail({ definition, hovered }: BlockThumbnailProps) {
  const environment = useColorMode()
  const configured = useStudioStore((state) => state.document.theme.colorMode)
  const reduced = useReducedMotion()

  const mode: ColorMode = configured === 'system' ? environment : configured
  const entry = THUMBNAILS[definition.id]
  const image = entry?.[mode]

  if (image === undefined) {
    return <ThumbnailPlaceholder definition={definition} />
  }

  /*
   * ACCESSIBILITY.md § Block palette and PERFORMANCE.md § Images: the clip is decoration, so it is
   * `aria-hidden`, it is never created under a reduced-motion preference — not paused, not requested —
   * and it exists only while the pointer is on the card. `preload="none"` plus a mount on hover is
   * what makes browsing the catalogue fetch no video at all.
   */
  const clip = reduced || !hovered ? undefined : entry?.clip?.[mode]

  return (
    <span className={SURFACE_CLASS} style={{ height: `${THUMBNAIL_HEIGHT_PX}px` }}>
      <Image
        alt=""
        blurDataURL={image.blurDataUrl}
        className="h-full w-full object-cover"
        height={image.height}
        placeholder="blur"
        sizes="160px"
        src={image.src}
        width={image.width}
      />
      {clip === undefined ? null : (
        // biome-ignore lint/a11y/noAriaHiddenOnFocusable: ACCESSIBILITY.md § Block palette — the clip is decoration with no controls, so it is not in the tab order to begin with
        <video
          aria-hidden="true"
          autoPlay
          className="absolute inset-0 h-full w-full object-cover"
          data-testid="block-thumbnail-clip"
          loop
          muted
          playsInline
          preload="none"
          src={clip}
        />
      )}
    </span>
  )
}

/**
 * A block with no thumbnail on disk still has an icon and a category colour — prompt 37: never a
 * broken image. `check:registry` gates the missing file in CI; this is what the panel does meanwhile.
 */
function ThumbnailPlaceholder({ definition }: { readonly definition: BlockDefinition }) {
  const Icon = iconFor(definition.icon)

  return (
    <span
      className={`${SURFACE_CLASS} grid place-items-center bg-surface-2 text-foreground-subtle`}
      data-testid="block-thumbnail-placeholder"
      style={{ height: `${THUMBNAIL_HEIGHT_PX}px` }}
    >
      <Icon size={16} />
    </span>
  )
}
