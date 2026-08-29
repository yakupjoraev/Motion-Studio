'use client'

import { commands } from '@motion-studio/editor'
import { ESCAPE_HATCH_PROP, type NodeId, withDeclaration } from '@motion-studio/schema'
import { splitDeclarations } from '@motion-studio/schema/css'
import { Button } from '@motion-studio/ui'
import Link from 'next/link'
import { useCallback } from 'react'

import { useStudioStore } from '../../../store/editor-store'
import { isPlaygroundProperty } from '../../playground/properties'
import { encodePermalink } from '../../playground/sharing/permalink'

/**
 * PLAYGROUND.md § Send to selection: what a sent value looks like once it has landed. One chip per
 * declaration, with the edit action that reopens the playground on that value — which is the
 * permalink, so there is one way to carry a value between the two surfaces.
 */
export function CustomCssChips({ nodeId }: { readonly nodeId: NodeId }) {
  const css = useStudioStore((state) => {
    const stored = state.document.nodes[nodeId]?.props[ESCAPE_HATCH_PROP]

    return typeof stored === 'string' ? stored : ''
  })

  const remove = useCallback(
    (property: string) => {
      useStudioStore.getState().dispatch(
        commands.setProp({
          nodeId,
          path: ESCAPE_HATCH_PROP,
          value: withDeclaration(css, property, ''),
        }),
      )
    },
    [css, nodeId],
  )

  const declarations = splitDeclarations(css).declarations

  if (declarations.length === 0) {
    return null
  }

  return (
    <ul className="m-0 flex list-none flex-col gap-1 p-0" data-testid="custom-css-chips">
      {declarations.map((declaration) => (
        <li
          className="flex items-center gap-1 rounded-sm border border-border px-1.5 py-1"
          key={declaration.property}
        >
          <span className="min-w-0 flex-1 truncate font-mono text-2xs text-foreground-muted">
            <span className="text-foreground">{declaration.property}</span>: {declaration.value}
          </span>
          <EditLink property={declaration.property} value={declaration.value} />
          <Button
            size="sm"
            variant="ghost"
            onClick={() => remove(declaration.property)}
            aria-label={`Remove the custom ${declaration.property}`}
          >
            Remove
          </Button>
        </li>
      ))}
    </ul>
  )
}

/** The playground opens on this value; a link it cannot encode is one the chip does not offer. */
function EditLink({ property, value }: { readonly property: string; readonly value: string }) {
  const link = isPlaygroundProperty(property) ? encodePermalink({ property, value }) : undefined

  if (link === undefined || !link.ok) {
    return null
  }

  return (
    <Link
      href={`/playground${link.value}`}
      className="rounded-sm px-1.5 py-0.5 text-2xs text-accent underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-accent-ring"
    >
      Edit
    </Link>
  )
}
