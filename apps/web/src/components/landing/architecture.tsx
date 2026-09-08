import { getRequestDictionary } from '../../lib/i18n/request-locale'

import { SectionIntro } from './section-intro'
import { Section } from './section-rail'

/**
 * The dependency graph from README.md, as HTML rather than as an image or an ASCII block.
 *
 * As HTML it is selectable, it reflows at 320 px, it scales at 200 % zoom, and — the reason that
 * matters most here — a screen reader reads it as four nested lists with headings rather than as a
 * wall of box-drawing characters. The `alt` a diagram usually needs is the markup itself.
 *
 * **Drawn as a section cut rather than as four cards.** The claim is that dependency runs one way,
 * downward, and strata separated by hairlines with an arrow down their edge say that; four rounded
 * boxes in a column say "four things". Each layer arrives on its own way into the viewport, which is
 * a CSS view timeline on the element itself and nothing else.
 *
 * Package names are not translated: `editor` is what the directory is called in both languages.
 * What each one *does* is prose, and that is what the dictionary carries.
 */
export function Architecture() {
  const { architecture } = getRequestDictionary().landing

  const layers = [
    {
      title: architecture.appTitle,
      note: architecture.appNote,
      packages: [{ name: 'apps/web', detail: architecture.appWeb }],
    },
    {
      title: architecture.editingTitle,
      note: architecture.editingNote,
      packages: [
        { name: 'editor', detail: architecture.editingEditor },
        { name: 'canvas', detail: architecture.editingCanvas },
        { name: 'dnd', detail: architecture.editingDnd },
        { name: 'codegen', detail: architecture.editingCodegen },
      ],
    },
    {
      title: architecture.domainTitle,
      note: architecture.domainNote,
      packages: [
        { name: 'schema', detail: architecture.domainSchema },
        { name: 'blocks', detail: architecture.domainBlocks },
        { name: 'motion', detail: architecture.domainMotion },
      ],
    },
    {
      title: architecture.foundationTitle,
      note: architecture.foundationNote,
      packages: [
        { name: 'ui · theme · tokens', detail: architecture.foundationChrome },
        { name: 'hooks · utils · icons · config', detail: architecture.foundationShared },
      ],
    },
  ]

  return (
    <Section id="architecture" label={architecture.rail}>
      <div className="flex flex-col gap-10 py-16 lg:py-24">
        <SectionIntro heading={architecture.heading} id="architecture-heading">
          {architecture.intro}
        </SectionIntro>

        <div className="relative">
          {/* The direction, drawn once down the whole cut. */}
          <span
            aria-hidden="true"
            className="absolute top-2 bottom-8 left-0 hidden w-px bg-border lg:block"
          />
          <span
            aria-hidden="true"
            className="absolute bottom-3 left-[-4px] hidden text-[10px] text-foreground-muted leading-none lg:block"
          >
            ▼
          </span>

          <ol className="flex flex-col lg:pl-8">
            {layers.map((layer, index) => (
              <li
                className="grid gap-x-8 gap-y-3 border-border border-t py-6 lg:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]"
                data-ms-enter
                key={layer.title}
              >
                <div className="flex flex-col gap-1">
                  <h3 className="flex items-baseline gap-2 font-mono text-xs uppercase tracking-[0.16em]">
                    <span className="text-[var(--ms-l-accent-strong)] tabular-nums">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    {layer.title}
                  </h3>
                  <p className="text-foreground-muted text-sm leading-snug">{layer.note}</p>
                </div>

                <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  {layer.packages.map((entry) => (
                    <li className="flex flex-col gap-0.5" key={entry.name}>
                      <p className="font-mono text-[13px] text-foreground">{entry.name}</p>
                      <p className="text-foreground-muted text-xs leading-snug">{entry.detail}</p>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </div>

        <p className="text-foreground-muted text-sm lg:pl-8">{architecture.footnote}</p>
      </div>
    </Section>
  )
}
