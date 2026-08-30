import { blockRegistry } from '@motion-studio/blocks/registry'
import { BLOCK_CATEGORIES, blockId } from '@motion-studio/schema'
import { ImageResponse } from 'next/og'

export const alt = 'A block in the Motion Studio catalogue'

export const size = { width: 1200, height: 630 }

export const contentType = 'image/png'

export function generateStaticParams(): { slug: string }[] {
  return blockRegistry.list().map((definition) => ({ slug: definition.id }))
}

/**
 * One card per block, generated at build time by `next/og`.
 *
 * The colours are literals rather than `var(--ms-color-*)` for the reason the landing page's image
 * states: Satori resolves no cascade and no custom properties, so a token reference renders as
 * transparent. These are `studioDark`'s surface-0, accent and foreground.
 *
 * The picture is the block's *name and description*, not a render of the block: Satori is not a
 * browser, and a component that resolves through tokens and container queries would come out as an
 * empty rectangle — a wrong picture is worse than a typographic one.
 */
export default async function BlockOpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const definition = blockRegistry.get(blockId(slug))

  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: 72,
        background: '#0b0b0f',
        backgroundImage:
          'radial-gradient(820px 480px at 12% -8%, rgba(124,106,247,0.32), transparent 70%), radial-gradient(640px 380px at 88% 10%, rgba(56,132,255,0.2), transparent 70%)',
        color: '#f5f5f7',
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: 22,
          letterSpacing: 4,
          textTransform: 'uppercase',
          color: '#9d9daa',
        }}
      >
        {definition === undefined ? 'Blocks' : BLOCK_CATEGORIES[definition.category]}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'flex', fontSize: 82, letterSpacing: -2, lineHeight: 1.05 }}>
          {definition?.name ?? 'Not found'}
        </div>
        <div style={{ display: 'flex', fontSize: 30, color: '#9d9daa', lineHeight: 1.35 }}>
          {definition?.description ?? ''}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          fontSize: 22,
          letterSpacing: 4,
          textTransform: 'uppercase',
          color: '#7c6af7',
        }}
      >
        Motion Studio · tune it, take the code
      </div>
    </div>,
    size,
  )
}
