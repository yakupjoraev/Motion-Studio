import { DEFINITIONS, renderRegistry } from '@motion-studio/blocks'
import type { Meta, StoryObj } from '@storybook/react'
import { type ComponentType, Suspense } from 'react'

/**
 * The surface `scripts/generate-thumbnails.mjs` screenshots.
 *
 * One story rather than twenty-two: the block id arrives as an arg in the URL and the component comes
 * from the registry, so a block added later gets a thumbnail without anybody remembering to write a
 * story for it. That is the same reason the meta-tests iterate the registry instead of listing blocks.
 *
 * It renders `previewProps` — COMPONENT_LIBRARY.md § Thumbnails — which is the arranged state a block
 * looks its best in, not the defaults it is dropped with.
 */
/**
 * The generator needs the block list and cannot import TypeScript, so the page publishes it. This is
 * the registry itself — not a copy — so a block added later is generated without anybody editing a
 * list, which is the same guarantee the meta-tests give.
 */
declare global {
  interface Window {
    __MOTION_STUDIO_BLOCKS__?: readonly string[]
  }
}

if (typeof window !== 'undefined') {
  window.__MOTION_STUDIO_BLOCKS__ = DEFINITIONS.map((definition) => definition.id)
}

const meta = {
  title: 'Thumbnail/Block',
  parameters: {
    layout: 'fullscreen',
    // The generator drives this page; a docs page for it would only be a second thing to keep current.
    docs: { disable: true },
    a11y: { disable: true },
  },
} satisfies Meta

export default meta

interface ThumbnailArgs {
  readonly blockId: string
}

function Thumbnail({ blockId }: ThumbnailArgs) {
  const definition = DEFINITIONS.find((one) => one.id === blockId)
  const Component = renderRegistry[blockId] as ComponentType<Record<string, unknown>> | undefined

  if (definition === undefined || Component === undefined) {
    return <div data-thumbnail-error={blockId}>No block is registered as “{blockId}”</div>
  }

  return (
    /*
     * The stage paints the theme's own surface across the whole frame. Without it the iframe's body
     * is transparent and a headless screenshot comes back with black behind the block — which looks
     * like a broken thumbnail in light mode and hides the bug in dark.
     *
     * Centred, because a `stat` or a `badge` is a few hundred pixels wide: left to itself it lands in
     * the corner of a 1280 × 800 frame and the thumbnail is mostly emptiness. A full-width block
     * ignores the centring and spans anyway.
     *
     * The generator waits for `data-thumbnail-ready`, so a screenshot cannot catch a half-mounted tree.
     */
    <div
      className="flex min-h-screen w-full items-center justify-center bg-surface-0 px-10"
      data-thumbnail-ready={blockId}
    >
      <div className="w-full">
        <Suspense fallback={null}>
          <Component {...(definition.previewProps as Record<string, unknown>)} />
        </Suspense>
      </div>
    </div>
  )
}

type Story = StoryObj<ThumbnailArgs>

export const Preview: Story = {
  args: { blockId: 'hero-centered' },
  render: (args) => <Thumbnail {...args} />,
}
