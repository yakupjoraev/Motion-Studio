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
 * **Grouped into four, not listed as eleven.** A spec table with a hairline under every row is the
 * laziest shape a list can take and the hardest to read: nothing in it is more important than
 * anything else. The groups are what a reader is actually asking — what is the frame, what holds the
 * state, what handles interaction, and what was decided rather than chosen from a menu.
 *
 * A library's name and version are the same in both languages; only the reason is translated.
 */
export function Stack() {
  const { stack } = getRequestDictionary().landing

  const groups = [
    {
      title: stack.groupFrame,
      choices: [
        { name: 'Next.js 15', reason: stack.next },
        { name: 'TypeScript 5.6, strict', reason: stack.typescript },
        { name: 'Tailwind v4', reason: stack.tailwind },
        { name: 'Biome', reason: stack.biome },
      ],
    },
    {
      title: stack.groupState,
      choices: [
        { name: 'Zustand 5', reason: stack.zustand },
        { name: 'Immer 10', reason: stack.immer },
        { name: 'Zod 3', reason: stack.zod },
      ],
    },
    {
      title: stack.groupInteraction,
      choices: [
        { name: 'Motion 11', reason: stack.motion },
        { name: 'dnd-kit', reason: stack.dndKit },
        { name: 'CodeMirror 6', reason: stack.codemirror },
      ],
    },
    {
      title: stack.groupChoice,
      choices: [{ name: stack.noBackendName, reason: stack.noBackend }],
    },
  ]

  return (
    <Section id="stack" label={stack.rail}>
      <div className="flex flex-col gap-10 py-16 lg:py-24">
        <SectionIntro heading={stack.heading} id="stack-heading">
          {stack.introBefore} <code className="font-mono">docs/</code>
          {stack.introAfter}
        </SectionIntro>

        <div className="grid gap-x-12 gap-y-10 lg:grid-cols-2">
          {groups.map((group) => (
            <section className="flex flex-col gap-5" data-ms-enter key={group.title}>
              <h3 className="flex items-center gap-3 font-mono text-[10px] text-foreground-muted uppercase tracking-[0.22em]">
                <span aria-hidden="true" className="h-px w-6 bg-[var(--ms-l-accent)]" />
                {group.title}
              </h3>

              <dl className="flex flex-col gap-5">
                {group.choices.map((choice) => (
                  <div className="flex flex-col gap-1" key={choice.name}>
                    <dt className="font-mono text-[13px] text-foreground">{choice.name}</dt>
                    <dd className="text-foreground-muted text-sm leading-relaxed">
                      {choice.reason}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </div>
    </Section>
  )
}
