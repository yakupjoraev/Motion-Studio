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

        <ol className="flex flex-col gap-3">
          {layers.map((layer, index) => (
            <li
              className="rounded-xl border border-border bg-surface-1 p-4 sm:p-5"
              key={layer.title}
            >
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <h3 className="font-mono text-2xs uppercase tracking-[0.14em]">
                  <span className="text-foreground-muted">
                    {String(index + 1).padStart(2, '0')} ·{' '}
                  </span>
                  {layer.title}
                </h3>
                <p className="text-foreground-muted text-sm">{layer.note}</p>
              </div>

              <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {layer.packages.map((entry) => (
                  <li
                    className="rounded-md border border-border-subtle bg-surface-2 px-3 py-2"
                    key={entry.name}
                  >
                    <p className="font-mono text-xs">{entry.name}</p>
                    <p className="text-foreground-muted text-xs leading-snug">{entry.detail}</p>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>

        <p className="text-foreground-muted text-sm">{architecture.footnote}</p>
      </div>
    </Section>
  )
}
