'use client'

import type { NodeId } from '@motion-studio/schema'

import { useStudioStore } from '../../../../store/editor-store'
import { ControlGroup } from '../control-group'

export interface CodeSectionProps {
  readonly nodeIds: readonly NodeId[]
}

/**
 * PRODUCT.md § 4 puts the selection's live TSX here. The printers are prompts 42–44, so what it can
 * honestly show today is the element the block's codegen descriptor says it prints as.
 */
export function CodeSection({ nodeIds }: CodeSectionProps) {
  const tags = useStudioStore((state) =>
    nodeIds
      .map((id) => state.document.nodes[id]?.blockId ?? '')
      .filter((one) => one !== '')
      .join(', '),
  )

  return (
    <ControlGroup id="code" label="Code">
      <p
        className="text-pretty break-words text-2xs text-foreground-subtle"
        data-testid="code-summary"
      >
        {tags === '' ? 'Nothing selected.' : `<${tags}>`} — the generated TSX arrives with the
        export engine.
      </p>
    </ControlGroup>
  )
}
