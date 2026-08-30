'use client'

/**
 * A schematic of the page, drawn from the template's top-level block ids — ADR-288. It is not a
 * screenshot: it says how the page is *built*, which is the question someone picking a starting
 * point is actually asking, and it cannot go stale the way a rendered image can.
 */
export interface TemplatePreviewProps {
  readonly outline: readonly string[]
}

/** Height in preview units. A hero is tall, a navbar is a rule, everything else is a band. */
const HEIGHT: Readonly<Record<string, number>> = {
  navbar: 5,
  'navbar-floating': 5,
  footer: 12,
  divider: 2,
  badge: 3,
}

const heightOf = (blockId: string): number =>
  HEIGHT[blockId] ?? (blockId.startsWith('hero-') ? 34 : 16)

/** The accent band: the one block a reader should notice first. */
const isFeature = (blockId: string): boolean =>
  blockId.startsWith('hero-') || blockId === 'pricing-table' || blockId === 'timeline'

export function TemplatePreview({ outline }: TemplatePreviewProps) {
  return (
    <div
      aria-hidden="true"
      className="flex h-full w-full flex-col gap-[2px] overflow-hidden rounded-md bg-surface-2 p-1.5"
    >
      {outline.map((blockId, index) => (
        <div
          className={isFeature(blockId) ? 'rounded-[2px] bg-accent/45' : 'rounded-[2px] bg-border'}
          // biome-ignore lint/suspicious/noArrayIndexKey: the outline is a fixed sequence, and two bands can be the same block
          key={`${blockId}-${index}`}
          style={{ flex: `${heightOf(blockId)} 0 0` }}
        />
      ))}
    </div>
  )
}
