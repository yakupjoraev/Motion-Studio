import type { Dictionary } from '../../src/lib/i18n/dictionary'

export interface LegalPageProps {
  readonly copy: Dictionary['legal']['privacy'] | Dictionary['legal']['terms']
}

/**
 * The shape both legal pages take — `prompts/69` § 2. One component because the two differ in words
 * and in nothing else, and a second copy of this markup would be a second place to fix a heading
 * level.
 *
 * A reading column rather than the landing's full-bleed bands: this is a document, and
 * `DESIGN_SYSTEM.md` § Typography puts a document between 60 and 75 characters a line.
 */
export function LegalPage({ copy }: LegalPageProps) {
  return (
    <main className="mx-auto w-full max-w-[46rem] px-6 py-16 md:py-24" id="main">
      <header className="flex flex-col gap-3">
        <h1 className="m-0 font-semibold text-3xl text-foreground tracking-tight">
          {copy.heading}
        </h1>
        <p className="m-0 font-mono text-2xs text-foreground-subtle uppercase tracking-wider">
          {copy.updated}
        </p>
        <p className="m-0 text-foreground-muted text-md leading-relaxed">{copy.lede}</p>
      </header>

      <div className="mt-12 flex flex-col gap-10">
        {copy.sections.map((section) => (
          <section className="flex flex-col gap-3" key={section.heading}>
            <h2 className="m-0 font-semibold text-foreground text-lg tracking-tight">
              {section.heading}
            </h2>
            {section.body.map((paragraph) => (
              <p className="m-0 text-foreground-muted leading-relaxed" key={paragraph}>
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </main>
  )
}
