'use client'

export interface BlockCardPreviewProps {
  readonly label: string
}

/**
 * DRAG_AND_DROP.md § Drag preview: the palette card at 90 % opacity, lifted. The scale and the shadow
 * are static — a drag preview that animates fights the cursor, so there is nothing here for
 * `prefers-reduced-motion` to switch off.
 */
export function BlockCardPreview({ label }: BlockCardPreviewProps) {
  return (
    <div
      className="flex min-w-[140px] scale-[1.02] items-center rounded-sm border border-border-strong bg-surface-2 px-2 py-1.5 opacity-90 shadow-lg"
      data-testid="block-card-preview"
    >
      <span className="truncate text-foreground text-xs">{label}</span>
    </div>
  )
}
