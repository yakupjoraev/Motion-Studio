'use client'

import { Button } from '@motion-studio/ui'

import { useStudio } from '../../../lib/i18n/studio-surface'
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
  const { panels } = useStudio()
  const name = useStudioStore((state) => state.document.meta.name)
  const width = useStudioStore((state) => state.document.meta.canvas.width)
  const nodes = useStudioStore((state) => Object.keys(state.document.nodes).length)
  const theme = useStudioStore((state) => state.document.theme.name)
  const entries = useStudioStore((state) => state.history.past.length)
  const setLeftTab = useStudioStore((state) => state.setLeftTab)

  return (
    <div className="flex w-full flex-col" data-testid="inspector-empty">
      <ControlGroup id="document" label={panels.inspectorDocument}>
        <Row label={panels.inspectorName} value={name} />
        <Row label={panels.inspectorCanvasWidth} value={`${width}px`} />
        <Row label={panels.inspectorBlocks} value={String(nodes)} />
      </ControlGroup>

      <ControlGroup id="document-theme" label={panels.inspectorTheme}>
        <Row label={panels.inspectorPreset} value={theme} />
        <Button onClick={() => setLeftTab('theme')} size="sm" variant="ghost">
          {panels.inspectorOpenTheme}
        </Button>
      </ControlGroup>

      <ControlGroup id="document-history" label={panels.inspectorVersionHistory}>
        <Row label={panels.inspectorSteps} value={String(entries)} />
        <p className="text-2xs text-foreground-subtle">{panels.inspectorVersionsSoon}</p>
      </ControlGroup>
    </div>
  )
}
