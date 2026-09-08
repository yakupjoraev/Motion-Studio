import { formatPlural } from '../../lib/i18n/plural'
import { getRequestDictionary, getRequestLocale } from '../../lib/i18n/request-locale'

import { ExportSubjectIsland } from './export-subject-island'
import { SectionIntro } from './section-intro'
import { Section } from './section-rail'

import {
  EXPORT_SAMPLE_FILES,
  EXPORT_SAMPLE_LINES,
  EXPORT_SAMPLE_PATH,
} from './generated/export-sample'

/** The five colours ADR-124 settled on, as token-backed classes. `plain` inherits and needs none. */
const TOKEN_CLASS: Readonly<Record<string, string>> = {
  comment: 'text-foreground-muted',
  string: 'text-success',
  number: 'text-info',
  keyword: 'text-accent',
  plain: '',
}

/**
 * The code that comes out — generated at build time by our own exporter and tokenised there too
 * (ADR-293). Nothing here is written by hand, which is the section's whole claim: the page cannot
 * show code the exporter would not produce, because it did not have the option.
 *
 * No typing animation. `prompts/51` suggests one, and a marketing page that withholds the code it is
 * bragging about until an animation finishes is the opposite of the argument — the reveal is that the
 * file is *already there*, complete, syntax-correct and four files long.
 *
 * **Two panes, because the claim is a comparison.** "The export is the component you were just
 * looking at" is checkable only if both are on screen: the block runs on the left, the bytes it came
 * out of the exporter as are on the right. The left pane is an island — it brings a block, a theme
 * scope and a preset table, none of which belong in this page's first load.
 */
export function ExportReveal() {
  const locale = getRequestLocale()
  const copy = getRequestDictionary().landing.export

  return (
    <Section id="export" label={copy.rail}>
      <div className="flex flex-col gap-10 py-16 lg:py-24">
        <SectionIntro heading={copy.heading} id="export-heading">
          {copy.intro}
        </SectionIntro>

        <div className="grid items-start gap-6 lg:grid-cols-2 lg:gap-8">
          <figure className="m-0 flex flex-col gap-3">
            <figcaption className="flex items-center gap-3 font-mono text-[10px] text-foreground-muted uppercase tracking-[0.2em]">
              <span className="h-px w-6 bg-[var(--ms-l-accent)]" />
              {copy.paneRendered}
            </figcaption>
            <div className="overflow-hidden border border-border bg-surface-1">
              <ExportSubjectIsland
                fallback={<span className="block aspect-[1280/480] w-full bg-surface-0" />}
              />
            </div>
          </figure>

          <figure className="m-0 flex flex-col gap-3">
            <figcaption className="flex items-center gap-3 font-mono text-[10px] text-foreground-muted uppercase tracking-[0.2em]">
              <span className="h-px w-6 bg-[var(--ms-l-accent)]" />
              {copy.paneSource}
            </figcaption>
            <div className="flex flex-col overflow-hidden border border-border bg-surface-1 lg:h-[22rem]">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-border-subtle border-b px-4 py-2.5">
                <span className="font-mono text-xs uppercase tracking-[0.12em]" id="export-file">
                  {EXPORT_SAMPLE_PATH}
                </span>
                <span className="font-mono text-foreground-muted text-xs uppercase tracking-[0.12em]">
                  {formatPlural(locale, EXPORT_SAMPLE_FILES.length, copy.fileCount)}
                </span>
              </div>

              {/*
            ACCESSIBILITY.md § Dialogs already settles the shape of a code block that scrolls:
            `tabindex="0"`, a role and a label. It is stated there for the export dialog and it holds
            wherever a `pre` scrolls — at 320 px this one does, and without the tab stop the right
            half of every line is unreachable from the keyboard (ADR-298).

            The ring is drawn inside the box because the figure clips it: an outer ring on an element
            that fills a container with `overflow-hidden` is a focus indicator nobody sees.
          */}
              <pre
                aria-labelledby="export-file"
                className="min-h-0 flex-1 overflow-auto px-4 py-4 font-mono text-xs leading-[1.7] focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent-ring sm:text-sm"
                // biome-ignore lint/a11y/useSemanticElements: <section> cannot replace <pre> — the white-space handling is what makes the sample readable
                role="region"
                // biome-ignore lint/a11y/noNoninteractiveTabindex: a region that scrolls has to be focusable, or the part of the file past the right edge is unreachable
                tabIndex={0}
              >
                <code>
                  {EXPORT_SAMPLE_LINES.map((line, index) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: a file's lines are identified by their number
                    <span className="block" key={index}>
                      {line.length === 0
                        ? ' '
                        : line.map((token, position) => (
                            <span
                              className={TOKEN_CLASS[token[0]] ?? ''}
                              // biome-ignore lint/suspicious/noArrayIndexKey: tokens are a fixed sequence within a line
                              key={position}
                            >
                              {token[1]}
                            </span>
                          ))}
                    </span>
                  ))}
                </code>
              </pre>
            </div>
          </figure>
        </div>
      </div>
    </Section>
  )
}
