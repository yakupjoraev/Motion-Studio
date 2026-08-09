import { sectionInnerStyles, sectionStyles } from './section.styles'
import type { SectionProps } from './section.types'

/**
 * A full-width band. Props in, JSX out: it does not know it is in an editor, which is what makes the
 * exported file the same component the canvas ran — COMPONENT_LIBRARY.md § Rules.
 */
export function Section({
  maxWidth,
  padding,
  background,
  align,
  minHeight,
  children,
}: SectionProps) {
  return (
    <section className={sectionStyles({ padding, background, align, minHeight })}>
      <div className={sectionInnerStyles({ maxWidth, align })}>{children}</div>
    </section>
  )
}
