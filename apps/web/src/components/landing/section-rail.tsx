import type { ReactNode } from 'react'

export interface SectionProps {
  /** The rail label. Mono, uppercase, tracked — the page's structural voice. */
  readonly label: string
  readonly id: string
  readonly children: ReactNode
}

/**
 * Every band of the page, hung off a ruler.
 *
 * The rail is the page's one structural device and it is not decoration: this product is an editor
 * with rulers down two edges of its canvas, and the landing page is laid out on one. The label is
 * the section's coordinate. Below `lg` the rail has nowhere to go, so it becomes the same label above
 * the section — the information survives, the device does not pretend to.
 *
 * The region is named by its heading first and its coordinate second, so a reader moving by landmark
 * hears "Seventeen packages, one direction. 05 / shape" rather than "05 / shape" — ADR-299.
 */
export function Section({ label, id, children }: SectionProps) {
  return (
    <section
      aria-labelledby={`${id}-heading ${id}-label`}
      className="relative scroll-mt-14 border-border-subtle border-t"
      id={id}
    >
      <div className="mx-auto w-full max-w-[76rem] px-5 sm:px-8 lg:pl-[7.5rem]">
        <p
          className="pt-8 font-mono text-2xs text-foreground-muted uppercase tracking-[0.18em] lg:absolute lg:top-20 lg:left-8 lg:w-[5rem] lg:pt-0 lg:text-right"
          id={`${id}-label`}
        >
          {label}
        </p>
        {children}
      </div>
    </section>
  )
}
