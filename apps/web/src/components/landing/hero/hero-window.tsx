import type { ReactNode } from 'react'

import { STAGE } from './hero-stage'

/**
 * The frame the page is being edited in.
 *
 * A strip with the document's name and the breakpoint it is laid out at, then the page. The strip is
 * the difference between "a screenshot floating on a marketing page" and "a document open in an
 * editor": it says what the frame is, and both facts on it are true of what is inside it.
 */
export function HeroWindow({ children }: { readonly children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border-strong bg-surface-1 [box-shadow:0_1px_0_0_color-mix(in_oklch,var(--ms-color-foreground)_12%,transparent)_inset,0_50px_100px_-50px_rgb(0_0_0/0.85)]">
      <div className="flex items-center gap-3 border-border-subtle border-b bg-surface-1 px-3 py-2">
        <span className="font-mono text-2xs text-foreground-muted tracking-[0.12em]">
          landing.motion
        </span>
        <span className="ml-auto rounded-full border border-border px-2 py-0.5 font-mono text-[10px] text-foreground-muted uppercase tracking-[0.14em]">
          {STAGE.width} px · lg
        </span>
      </div>
      {children}
    </div>
  )
}
