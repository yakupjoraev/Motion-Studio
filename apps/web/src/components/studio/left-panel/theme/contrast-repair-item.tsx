'use client'

import type { ContrastRepair } from '@motion-studio/theme'
import { Button, Collapsible } from '@motion-studio/ui'

export interface ContrastRepairItemProps {
  readonly repair: ContrastRepair
  /** `true` when the author declined this one and the failing pair is what ships. */
  readonly kept: boolean
  readonly onKeepMine: () => void
  readonly onRepair: () => void
}

const ratio = (value: number): string => `${value.toFixed(2)}:1`

/**
 * One repair, stated in full: what failed, what it measured, what the engine did about it, and the way
 * out — `THEME_ENGINE.md` § Contrast repair.
 *
 * "Keep mine" has a return path. A one-way door here would be the same defect ADR-095 names in the
 * canvas menu: the author who kept a failing accent by accident could never undo the choice from the
 * place that offered it.
 */
export function ContrastRepairItem({
  repair,
  kept,
  onKeepMine,
  onRepair,
}: ContrastRepairItemProps) {
  return (
    <li className="flex flex-col gap-1 border-border border-t pt-2 first:border-t-0 first:pt-0">
      <p className="text-[11px] text-foreground-muted leading-snug">
        {repair.token} on {repair.against} was {ratio(repair.measured)} (needs {repair.required}:1)
      </p>
      <p className="text-[11px] text-foreground leading-snug">
        {kept
          ? `Keeping yours. Accent step ${repair.step} would measure ${ratio(repair.repaired)}.`
          : `Using accent step ${repair.step} instead, which measures ${ratio(repair.repaired)}.`}
      </p>

      <div className="flex items-center gap-1">
        {kept ? (
          <Button onClick={onRepair} size="sm" variant="secondary">
            Repair it
          </Button>
        ) : (
          <Button onClick={onKeepMine} size="sm" variant="ghost">
            Keep mine
          </Button>
        )}
        <Collapsible trigger="Details">
          <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 px-1 py-1 text-[11px]">
            <dt className="text-foreground-subtle">Yours</dt>
            <dd className="font-mono">{repair.from}</dd>
            <dt className="text-foreground-subtle">Repaired</dt>
            <dd className="font-mono">{repair.to}</dd>
            <dt className="text-foreground-subtle">Measured</dt>
            <dd>{ratio(repair.measured)}</dd>
            <dt className="text-foreground-subtle">Required</dt>
            <dd>{repair.required}:1</dd>
          </dl>
        </Collapsible>
      </div>
    </li>
  )
}
