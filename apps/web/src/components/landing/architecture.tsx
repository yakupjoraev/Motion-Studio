import { SectionIntro } from './section-intro'
import { Section } from './section-rail'

/**
 * The dependency graph from README.md, as HTML rather than as an image or an ASCII block.
 *
 * As HTML it is selectable, it reflows at 320 px, it scales at 200 % zoom, and — the reason that
 * matters most here — a screen reader reads it as four nested lists with headings rather than as a
 * wall of box-drawing characters. The `alt` a diagram usually needs is the markup itself.
 */
const LAYERS = [
  {
    title: 'App',
    note: 'Next.js 15, App Router',
    packages: [{ name: 'apps/web', detail: 'landing · studio · playground · docs' }],
  },
  {
    title: 'Editing',
    note: 'One direction of dependency, downward only',
    packages: [
      { name: 'editor', detail: 'document · commands · history · selection' },
      { name: 'canvas', detail: 'viewport · zoom · pan · snap · guides' },
      { name: 'dnd', detail: 'drop rules · reorder · keyboard drag' },
      { name: 'codegen', detail: 'IR · printers · formatter' },
    ],
  },
  {
    title: 'Domain',
    note: 'What a document is, and what can go in it',
    packages: [
      { name: 'schema', detail: 'zod · .motion · migrations' },
      { name: 'blocks', detail: 'the registry · 72 blocks' },
      { name: 'motion', detail: 'presets · springs · scheduler' },
    ],
  },
  {
    title: 'Foundation',
    note: 'Depended on by everything, depending on nothing',
    packages: [
      { name: 'ui · theme · tokens', detail: 'chrome · CSS variables' },
      { name: 'hooks · utils · icons · config', detail: 'shared, and small' },
    ],
  },
] as const

export function Architecture() {
  return (
    <Section id="architecture" label="05 / shape">
      <div className="flex flex-col gap-10 py-16 lg:py-24">
        <SectionIntro heading="Seventeen packages, one direction.">
          Nothing depends on the app. The editor never imports a block — it talks to the registry
          through schema types only. That rule is what makes the export testable without a browser.
        </SectionIntro>

        <ol className="flex flex-col gap-3">
          {LAYERS.map((layer, index) => (
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

        <p className="text-foreground-muted text-sm">
          Read top to bottom: each layer may depend on the ones below it and never on the ones
          above.
        </p>
      </div>
    </Section>
  )
}
