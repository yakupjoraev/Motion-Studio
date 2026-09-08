import type { ReactNode } from 'react'

import { STAGE } from './hero-stage'

/**
 * The frame the page is being edited in: a sheet pinned to the drawing, with the document's name and
 * the breakpoint it is laid out at. The shadow is a hard offset rather than a blur — this is paper on
 * paper, not glass over a void.
 *
 * The theme the page inside wears is applied by the island, not here. `PRESETS` is the whole preset
 * table and its resolver; importing it in a component the route renders eagerly put 14 kB of theme
 * engine in the landing's first load — measured, 111 kB to 125 kB against a 120 kB budget.
 */
export function HeroWindow({ children }: { readonly children: ReactNode }) {
  return (
    <div className="border border-[var(--ms-l-ink)] bg-[var(--ms-l-raised)] shadow-[7px_7px_0_0_var(--ms-l-line-strong)]">
      <div className="flex items-center gap-3 border-[var(--ms-l-line)] border-b px-3 py-2">
        <span aria-hidden="true" className="block h-2 w-2 rounded-full bg-[var(--ms-l-accent)]" />
        <span className="font-mono text-[11px] text-[var(--ms-l-ink-soft)] tracking-[0.14em]">
          landing.motion
        </span>
        <span className="ml-auto font-mono text-[10px] text-[var(--ms-l-ink-soft)] uppercase tracking-[0.16em]">
          {STAGE.width} px · lg
        </span>
      </div>
      {children}
    </div>
  )
}
