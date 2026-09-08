import type { ReactNode } from 'react'

export interface WalkthroughBandProps {
  /** The inspector. It stays with the reader while the subject beside it travels. */
  readonly rows: ReactNode
  readonly subject: ReactNode
  readonly note: string
}

/**
 * The band both variants are laid out in, so they are the same shape and the same height whichever
 * one renders — the island's swap has to move nothing (ADR-295).
 *
 * The panel is sticky and the subject is tall, which is the arrangement the claim needs: a control
 * that stays under the hand while the thing it controls is watched. It is also the studio's own
 * arrangement, one column narrower.
 */
export function WalkthroughBand({ rows, subject, note }: WalkthroughBandProps) {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-12">
      <div className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
        {rows}
        <p className="text-foreground-muted text-sm leading-relaxed">{note}</p>
      </div>

      <div className="ms-sheet flex flex-col justify-center border border-border px-4 py-8 sm:px-8">
        {subject}
      </div>
    </div>
  )
}
