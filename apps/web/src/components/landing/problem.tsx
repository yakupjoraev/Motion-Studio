import { Section } from './section-rail'

/**
 * VISION.md § The problem, as the page's argument. Two columns and a rule between them, because the
 * claim is literally that there is a gap between two things — a three-card grid would flatten the
 * one shape the section is about.
 */
const SIDES = [
  {
    kind: 'Design tools',
    examples: 'Figma · Framer · Webflow',
    can: 'You drag, you tune, you see it move.',
    cannot: 'What comes out is a picture or a hosted page. Never code you own.',
  },
  {
    kind: 'Component libraries',
    examples: 'shadcn/ui · Aceternity · Magic UI',
    can: 'You get real code, and you keep it.',
    cannot: 'One hard-coded demo per effect. You cannot try 0.4 damping before you paste it in.',
  },
] as const

export function Problem() {
  return (
    <Section id="problem" label="01 / gap">
      <div className="flex flex-col gap-10 py-16 lg:py-24">
        <h2 className="max-w-[22ch] text-balance font-display text-3xl leading-tight tracking-[-0.02em] sm:text-4xl">
          Two kinds of tools, and nothing lives between them.
        </h2>

        <div className="grid gap-px overflow-hidden rounded-xl border border-border bg-border md:grid-cols-2">
          {SIDES.map((side) => (
            <div className="flex flex-col gap-4 bg-surface-1 p-6 sm:p-8" key={side.kind}>
              <div className="flex flex-col gap-1">
                <h3 className="font-medium text-lg tracking-tight">{side.kind}</h3>
                <p className="font-mono text-2xs text-foreground-muted uppercase tracking-[0.14em]">
                  {side.examples}
                </p>
              </div>
              <p className="text-foreground-muted">{side.can}</p>
              <p className="border-border-subtle border-t pt-4 text-foreground">{side.cannot}</p>
            </div>
          ))}
        </div>

        <p className="max-w-[46ch] text-balance text-lg text-foreground-muted leading-relaxed">
          The missing tool is the middle:{' '}
          <strong className="font-medium text-foreground">
            direct manipulation over real components, with code as the output format.
          </strong>
        </p>
      </div>
    </Section>
  )
}
