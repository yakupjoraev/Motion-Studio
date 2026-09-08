import type { ReactNode } from 'react'

/**
 * The sheet the page is pinned to.
 *
 * Deliberately not a window: no chrome bar, no file name, no traffic lights. A framed application
 * window on a marketing page reads as a screenshot whatever is inside it, and this page's argument is
 * that what you are looking at is not a picture of the product. A hairline and a hard offset shadow
 * are enough to say "pinned to the drawing" — paper on paper rather than glass over a void.
 *
 * What the bar used to print, the width and the breakpoint, is on the dimension line under the sheet
 * now, which is where a drawing puts a measurement.
 */
export function HeroWindow({ children }: { readonly children: ReactNode }) {
  return (
    <div className="border border-[var(--ms-l-ink)] bg-[var(--ms-l-raised)] shadow-[7px_7px_0_0_var(--ms-l-line-strong)]">
      {children}
    </div>
  )
}
