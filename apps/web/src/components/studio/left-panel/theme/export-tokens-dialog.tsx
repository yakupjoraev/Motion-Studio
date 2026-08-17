'use client'

import { TOKEN_FORMATS, type ThemeConfig, resolveForExport } from '@motion-studio/theme'
import { Button, Dialog, type TabItem, Tabs } from '@motion-studio/ui'
import { useMemo, useState } from 'react'

import { TokenFormatPanel } from './token-format-panel'

export interface ExportTokensDialogProps {
  readonly config: ThemeConfig
}

/**
 * The four formats of `THEME_ENGINE.md` § Theme in export, generated from one resolution so they
 * cannot disagree — ADR-171. The printers are pure functions in `packages/theme`; what belongs here is
 * the dialog, the copy button and the download.
 *
 * The output is computed when the dialog opens, not on every panel render: it is four strings of a few
 * kilobytes each, and nothing else in the studio needs them.
 */
export function ExportTokensDialog({ config }: ExportTokensDialogProps) {
  const [open, setOpen] = useState(false)

  const items = useMemo<readonly TabItem[]>(() => {
    if (!open) {
      return []
    }

    const theme = resolveForExport(config)

    return TOKEN_FORMATS.map((format) => ({
      value: format.id,
      label: format.label,
      content: <TokenFormatPanel format={format} source={format.print(theme)} />,
    }))
  }, [open, config])

  const first = items[0]

  return (
    <Dialog
      description="Four formats, generated from the same resolved theme."
      onOpenChange={setOpen}
      open={open}
      size="lg"
      title="Export tokens"
      trigger={
        <Button size="sm" variant="secondary">
          Export tokens
        </Button>
      }
    >
      {first === undefined ? null : (
        <Tabs aria-label="Token formats" defaultValue={first.value} items={items} />
      )}
    </Dialog>
  )
}
