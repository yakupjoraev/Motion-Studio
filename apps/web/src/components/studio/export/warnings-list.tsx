'use client'

import type { IRWarning, WarningCode } from '@motion-studio/codegen'
import { ExternalLinkIcon, WarningIcon } from '@motion-studio/icons'
import type { NodeId } from '@motion-studio/schema'
import { Badge, Button, Collapsible } from '@motion-studio/ui'
import type { Dictionary } from '../../../lib/i18n/dictionary'
import { useStudio } from '../../../lib/i18n/studio-surface'

export interface WarningsListProps {
  readonly warnings: readonly IRWarning[]
  /** Closes the dialog and selects the node — the action that ends the complaint instead of repeating it. */
  readonly onSelectNode: (id: NodeId) => void
}

/** EXPORT_ENGINE.md § Warnings, in the order that table lists them. */
const ORDER: readonly WarningCode[] = [
  'unsupported',
  'missing-alt',
  'a11y',
  'contrast',
  'approximation',
  'dependency',
  'perf',
]

const titles = (copy: Dictionary['studio']['export']): Readonly<Record<WarningCode, string>> => ({
  approximation: copy.warningApproximation,
  'missing-alt': copy.warningMissingAlt,
  contrast: copy.warningContrast,
  unsupported: copy.warningUnsupported,
  dependency: copy.warningDependency,
  perf: copy.warningPerf,
  a11y: copy.warningA11y,
})

/** The docs site serves `docs/`; the link is the section the warning names. */
const href = (link: string): string => `/docs/${link.replace(/^docs\//, '')}`

/**
 * Above the code, grouped, counted, and never blocking — § Warnings. A clean export collapses to one
 * line rather than disappearing: "no warnings" is information, and an empty space is not.
 */
export function WarningsList({ warnings, onSelectNode }: WarningsListProps) {
  const { export: copy } = useStudio()
  if (warnings.length === 0) {
    return (
      <p
        className="px-2 py-1.5 text-2xs text-foreground-subtle"
        data-testid="export-warnings-empty"
      >
        {copy.noWarnings}
      </p>
    )
  }

  const groups = ORDER.map((code) => ({
    code,
    entries: warnings.filter((entry) => entry.code === code),
  })).filter((group) => group.entries.length > 0)

  return (
    <div className="flex flex-col gap-1" data-testid="export-warnings">
      {groups.map(({ code, entries }) => (
        <Collapsible
          defaultOpen={code === 'unsupported' || code === 'missing-alt'}
          key={code}
          trigger={
            <span className="flex min-w-0 items-center gap-2">
              <WarningIcon className="text-warning" size={14} />
              <span className="truncate font-medium text-xs">{titles(copy)[code]}</span>
              <Badge tone="warning">{entries.length}</Badge>
            </span>
          }
        >
          <ul className="flex flex-col gap-1 pt-1">
            {entries.map((entry, index) => (
              <li
                className="flex items-start gap-2 pl-6 text-2xs text-foreground-muted"
                key={`${entry.code}-${index}-${entry.message}`}
              >
                <span className="min-w-0 flex-1">{entry.message}</span>

                {entry.nodeId === undefined ? null : (
                  <Button
                    onClick={() => onSelectNode(entry.nodeId as NodeId)}
                    size="sm"
                    variant="ghost"
                  >
                    {copy.selectIt}
                  </Button>
                )}

                <a
                  className="inline-flex shrink-0 items-center gap-1 text-accent underline underline-offset-2"
                  href={href(entry.docsLink)}
                  rel="noreferrer"
                  target="_blank"
                >
                  {copy.docs}
                  <ExternalLinkIcon aria-hidden size={12} />
                </a>
              </li>
            ))}
          </ul>
        </Collapsible>
      ))}
    </div>
  )
}
