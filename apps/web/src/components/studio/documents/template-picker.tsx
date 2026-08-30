'use client'

import { Dialog } from '@motion-studio/ui'
import { useEffect, useState } from 'react'

import { useStudioStore } from '../../../store/editor-store'

import { useDocuments } from './documents-context'
import { TemplatePreview } from './template-preview'

export interface TemplateEntry {
  readonly slug: string
  readonly name: string
  readonly description: string
  readonly nodeCount: number
  readonly outline: readonly string[]
}

const isEntry = (value: unknown): value is TemplateEntry =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as TemplateEntry).slug === 'string' &&
  Array.isArray((value as TemplateEntry).outline)

const CARD =
  'flex flex-col gap-2 rounded-lg border border-border bg-surface-1 p-3 text-left outline-none transition-colors hover:border-accent focus-visible:shadow-focus'

/**
 * `File → New` — FILE_FORMAT.md § Templates. The manifest is fetched rather than bundled: eight
 * descriptions and their outlines are 3 kB the studio's first load has no reason to carry, and the
 * dialog is the first thing that needs them.
 */
export function TemplatePicker() {
  const open = useStudioStore((state) => state.ui.activeDialog === 'templates')
  const setActiveDialog = useStudioStore((state) => state.setActiveDialog)
  const { newBlank, newFromTemplate } = useDocuments()
  const [templates, setTemplates] = useState<readonly TemplateEntry[]>([])

  useEffect(() => {
    if (!open || templates.length > 0) {
      return
    }

    const controller = new AbortController()

    fetch('/templates/templates.json', { signal: controller.signal })
      .then((response) => (response.ok ? response.json() : []))
      .then((parsed: unknown) => {
        setTemplates(Array.isArray(parsed) ? parsed.filter(isEntry) : [])
      })
      .catch(() => undefined)

    return () => controller.abort()
  }, [open, templates.length])

  const start = (run: () => Promise<void>): void => {
    setActiveDialog(null)
    void run()
  }

  return (
    <Dialog
      description="Start from a page that is already built, or from nothing at all."
      onOpenChange={(next) => setActiveDialog(next ? 'templates' : null)}
      open={open}
      size="lg"
      title="New document"
    >
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3" data-testid="template-picker">
        <button className={CARD} onClick={() => start(newBlank)} type="button">
          <span className="flex h-[92px] items-center justify-center rounded-md border border-border border-dashed text-foreground-muted text-xs">
            Empty
          </span>
          <span className="font-medium text-sm">Blank</span>
          <span className="text-foreground-muted text-xs">
            One root container. The canvas says what to do next.
          </span>
        </button>

        {templates.map((template) => (
          <button
            className={CARD}
            data-testid={`template-${template.slug}`}
            key={template.slug}
            onClick={() => start(() => newFromTemplate(template.slug))}
            type="button"
          >
            <span className="h-[92px]">
              <TemplatePreview outline={template.outline} />
            </span>
            <span className="flex items-baseline justify-between gap-2">
              <span className="font-medium text-sm">{template.name}</span>
              <span className="text-foreground-muted text-xs">{template.nodeCount} blocks</span>
            </span>
            <span className="text-foreground-muted text-xs">{template.description}</span>
          </button>
        ))}
      </div>
    </Dialog>
  )
}
