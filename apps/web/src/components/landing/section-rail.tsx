import type { ReactNode } from 'react'

export interface SectionProps {
  /** The rail label. Mono, uppercase, tracked — the page's structural voice. */
  readonly label: string
  readonly id: string
  readonly children: ReactNode
  /**
   * Content that runs the full width of the page rather than the reading column.
   *
   * A slot rather than a negative margin on the child: this container is not centred — it carries the
   * rail's own left inset — so `margin-inline: calc(50% - 50vw)` inside it lands off-centre and hangs
   * the bleed over the right edge. Measured at 1440: 44 px short on the left and 44 px past the right.
   */
  readonly bleed?: ReactNode
}

/**
 * Every band of the page, opened the way the first screen is: an origin.
 *
 * The rail used to hang the label in the left margin, small and vertically centred against a display
 * heading — which reads as a stray note rather than as a coordinate, and on a narrow screen it moved
 * somewhere else entirely. The first screen already had the right device and only used it once: a tick
 * at the corner, a rule run out from it left to right, and the coordinate sitting on the rule. Every
 * band now opens with that mark, so the page is one drawing with eight origins rather than a stack of
 * sections with notes beside them.
 *
 * The mark carries the section's own border: a band that drew both had a hairline under the rule.
 * The rule is `--ms-l-line-strong` because it is now the structure rather than a divider.
 *
 * The region is named by its heading first and its coordinate second, so a reader moving by landmark
 * hears "Fifteen packages, one direction. 05 / shape" rather than "05 / shape" — ADR-299.
 */
export function Section({ label, id, children, bleed }: SectionProps) {
  return (
    <section
      aria-labelledby={`${id}-heading ${id}-label`}
      className="relative scroll-mt-14"
      id={id}
    >
      {/*
        The origin runs the container's full width, outside the reading column's rail inset: the mark
        opens the sheet, the content sits in from it. `pt-9` is the room the coordinate needs above the
        rule.
      */}
      <div className="mx-auto w-full max-w-[76rem] px-5 pt-9 sm:px-8">
        <div className="relative">
          <span
            aria-hidden="true"
            className="absolute -top-4 left-0 h-4 w-px origin-top bg-[var(--ms-l-line-strong)]"
            data-ms-tick
          />
          <span
            aria-hidden="true"
            className="absolute -top-px right-0 left-0 h-px origin-left bg-[var(--ms-l-line-strong)]"
            data-ms-run
          />
          <p
            className="absolute -top-7 left-2 font-mono text-[10px] text-[var(--ms-l-ink-soft)] uppercase tracking-[0.2em]"
            id={`${id}-label`}
          >
            {label}
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[76rem] px-5 sm:px-8 lg:pl-[7.5rem]">{children}</div>
      {bleed}
    </section>
  )
}
