'use client'

import { Collapsible } from '@motion-studio/ui'
import type { ReactNode } from 'react'

import { useStudioStore } from '../../../store/editor-store'

export interface ControlGroupProps {
  /** The section id the open state is stored under — one key per section, not per block. */
  readonly id: string
  /**
   * Already in the reader's language. Translating here would mean guessing where the string came
   * from: a block's group heading is in the registry's table and the studio's own six are in the
   * dictionary, and only the caller knows which it is holding.
   */
  readonly label: string
  readonly children: ReactNode
}

/**
 * A section of the inspector — UI_GUIDELINES.md § Section headers. Open state lives in the ui slice
 * keyed by section id, so a heading and a section agree about whether "Layout" is open, and
 * `use-persisted-sections` is what carries that across a reload.
 */
export function ControlGroup({ id, label, children }: ControlGroupProps) {
  const open = useStudioStore((state) => state.ui.rightPanel.openSections[id] ?? true)
  const setSectionOpen = useStudioStore((state) => state.setSectionOpen)

  return (
    <Collapsible
      className="border-border border-b"
      contentClassName="flex flex-col gap-1 px-3 pt-1 pb-3"
      onOpenChange={(next) => setSectionOpen(id, next)}
      open={open}
      trigger={
        <span
          className="font-medium text-2xs uppercase tracking-[0.06em]"
          data-testid={`section-${id}`}
        >
          {label}
        </span>
      }
      triggerClassName="sticky top-0 z-10 bg-surface-1 px-3"
    >
      {children}
    </Collapsible>
  )
}
