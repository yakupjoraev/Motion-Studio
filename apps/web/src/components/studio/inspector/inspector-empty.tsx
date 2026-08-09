'use client'

import { Button } from '@motion-studio/ui'

import { useStudioStore } from '../../../store/editor-store'

import { ControlGroup } from './control-group'

const Row = ({ label, value }: { readonly label: string; readonly value: string }) => (
  <div className="flex items-baseline justify-between gap-2 text-xs">
    <span className="text-foreground-muted">{label}</span>
    <span className="truncate text-foreground tabular-nums">{value}</span>
  </div>
)

/**
 * PRODUCT.md § 4 through the prompt's own words: an empty inspector wastes the most valuable panel in
 * the app. With nothing selected it reports the document — the thing the user is actually editing.
 */
export function InspectorEmpty() {
  const name = useStudioStore((state) => state.document.meta.name)
  const width = useStudioStore((state) => state.document.meta.canvas.width)
  const nodes = useStudioStore((state) => Object.keys(state.document.nodes).length)
  const theme = useStudioStore((state) => state.document.theme.name)
  const entries = useStudioStore((state) => state.history.past.length)
  const setLeftTab = useStudioStore((state) => state.setLeftTab)

  return (
    <div className="flex w-full flex-col" data-testid="inspector-empty">
      <ControlGroup id="document" label="Document">
        <Row label="Name" value={name} />
        <Row label="Canvas width" value={`${width}px`} />
        <Row label="Blocks" value={String(nodes)} />
      </ControlGroup>

      <ControlGroup id="document-theme" label="Theme">
        <Row label="Preset" value={theme} />
        <Button onClick={() => setLeftTab('theme')} size="sm" variant="ghost">
          Open the theme panel
        </Button>
      </ControlGroup>

      <ControlGroup id="document-history" label="Version history">
        <Row label="Steps" value={String(entries)} />
        <p className="text-2xs text-foreground-subtle">Saved versions arrive with persistence.</p>
      </ControlGroup>
    </div>
  )
}
