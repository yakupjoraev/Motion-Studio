import { SectionIntro } from './section-intro'
import { Section } from './section-rail'

/**
 * TECH_STACK.md, condensed to one line of reasoning each — `prompts/51`: "Engineers read this
 * section and judge the project by whether the reasons are real."
 *
 * So the reasons are the real ones, including the two rejections, because a stack list that only
 * says yes tells a reader nothing about how the choices were made.
 */
const CHOICES = [
  {
    name: 'Next.js 15',
    reason:
      'Server Components for the content routes; the studio is one client island in a prerendered shell.',
  },
  {
    name: 'TypeScript 5.6, strict',
    reason:
      '`noUncheckedIndexedAccess` and `exactOptionalPropertyTypes` on. Zero `any` — the document model is the point.',
  },
  {
    name: 'Zustand 5',
    reason:
      'One sliced store. Redux Toolkit is ceremony for a single store, and Immer patches give us history more cheaply.',
  },
  {
    name: 'Immer 10',
    reason:
      'Commands are pure functions on a draft, and the patch pair is the undo entry. 200 steps cost kilobytes.',
  },
  {
    name: 'Zod 3',
    reason:
      'One schema per block generates the inspector, validates the file and types the props. Three jobs, one source.',
  },
  {
    name: 'Tailwind v4',
    reason:
      'The exported code has to be Tailwind, so the studio writes what it emits. Tokens generate the `@theme` block.',
  },
  {
    name: 'Motion 11',
    reason:
      'One animation library, no second one. A scroll-scrubbed timeline is a paused CSS animation the shared bus seeks.',
  },
  {
    name: 'dnd-kit',
    reason:
      'Pointer-based, so keyboard dragging is a first-class path rather than an HTML5 API limitation.',
  },
  {
    name: 'CodeMirror 6',
    reason:
      'Monaco is ~2 MB for what is a CSS textarea. Loaded on demand, never in the studio’s first chunk.',
  },
  {
    name: 'Biome',
    reason:
      'One tool for lint and format. ESLint plus Prettier is two tools, slower, and twice the configuration.',
  },
  {
    name: 'No backend',
    reason:
      'Local-first. IndexedDB and a file on your disk. No accounts, no telemetry, nothing leaves the browser.',
  },
] as const

export function Stack() {
  return (
    <Section id="stack" label="06 / stack">
      <div className="flex flex-col gap-10 py-16 lg:py-24">
        <SectionIntro heading="The stack, with the actual reasons." id="stack-heading">
          Every one of these is written down at length in <code className="font-mono">docs/</code>,
          with the alternatives that were rejected and why.
        </SectionIntro>

        <dl className="grid gap-px overflow-hidden rounded-xl border border-border bg-border">
          {CHOICES.map((choice) => (
            <div
              className="grid gap-1 bg-surface-1 px-4 py-3.5 sm:grid-cols-[minmax(0,12rem)_minmax(0,1fr)] sm:gap-6 sm:px-5"
              key={choice.name}
            >
              <dt className="font-mono text-xs tracking-tight">{choice.name}</dt>
              <dd className="text-foreground-muted text-sm leading-relaxed">{choice.reason}</dd>
            </div>
          ))}
        </dl>
      </div>
    </Section>
  )
}
