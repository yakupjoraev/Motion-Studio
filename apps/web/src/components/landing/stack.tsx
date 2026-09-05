import { getRequestDictionary } from '../../lib/i18n/request-locale'

import { SectionIntro } from './section-intro'
import { Section } from './section-rail'

/**
 * TECH_STACK.md, condensed to one line of reasoning each — `prompts/51`: "Engineers read this
 * section and judge the project by whether the reasons are real."
 *
 * So the reasons are the real ones, including the two rejections, because a stack list that only
 * says yes tells a reader nothing about how the choices were made.
 *
 * A library's name and version are the same in both languages; only the reason is translated.
 */
export function Stack() {
  const { stack } = getRequestDictionary().landing

  const choices = [
    { name: 'Next.js 15', reason: stack.next },
    { name: 'TypeScript 5.6, strict', reason: stack.typescript },
    { name: 'Zustand 5', reason: stack.zustand },
    { name: 'Immer 10', reason: stack.immer },
    { name: 'Zod 3', reason: stack.zod },
    { name: 'Tailwind v4', reason: stack.tailwind },
    { name: 'Motion 11', reason: stack.motion },
    { name: 'dnd-kit', reason: stack.dndKit },
    { name: 'CodeMirror 6', reason: stack.codemirror },
    { name: 'Biome', reason: stack.biome },
    { name: stack.noBackendName, reason: stack.noBackend },
  ]

  return (
    <Section id="stack" label={stack.rail}>
      <div className="flex flex-col gap-10 py-16 lg:py-24">
        <SectionIntro heading={stack.heading} id="stack-heading">
          {stack.introBefore} <code className="font-mono">docs/</code>
          {stack.introAfter}
        </SectionIntro>

        <dl className="grid gap-px overflow-hidden rounded-xl border border-border bg-border">
          {choices.map((choice) => (
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
