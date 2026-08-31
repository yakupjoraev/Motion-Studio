'use client'

import { commands } from '@motion-studio/editor'
import {
  ESCAPE_HATCH_PROP,
  type MotionDocument,
  type NodeId,
  escapeHatchProperties,
  withDeclaration,
} from '@motion-studio/schema'

import { deferredBlockRegistry } from './block-registry'
import { useStudioStore } from './editor-store'
import { type EscapeHatchTarget, escapeHatchPort } from './escape-hatch-port'

/**
 * The studio half of ADR-279. It knows the registry and the commands; the port carries the summary.
 *
 * The subscription outlives the shell on purpose. Navigating to `/playground` unmounts the studio,
 * and a selection that disappeared on the way to the tool that writes to it would make the feature
 * unreachable by the route it is meant to be used from.
 */
let connected = false

const cssOf = (props: Readonly<Record<string, unknown>>): string => {
  const stored = props[ESCAPE_HATCH_PROP]

  return typeof stored === 'string' ? stored : ''
}

export function readTarget(
  document: MotionDocument,
  ids: readonly NodeId[],
): EscapeHatchTarget | undefined {
  const [id] = ids

  if (ids.length !== 1 || id === undefined) {
    return undefined
  }

  const node = document.nodes[id]
  const definition = node === undefined ? undefined : deferredBlockRegistry.get(node.blockId)

  if (node === undefined || definition === undefined) {
    return undefined
  }

  return {
    nodeId: node.id,
    nodeName: node.name,
    blockName: definition.name,
    properties: escapeHatchProperties(definition.capabilities),
    css: cssOf(node.props),
  }
}

export function connectEscapeHatch(): void {
  if (connected) {
    return
  }

  connected = true

  const publish = (): void => {
    const state = useStudioStore.getState()

    escapeHatchPort.publish(readTarget(state.document, state.selection.ids))
  }

  escapeHatchPort.register((property, value) => {
    const state = useStudioStore.getState()
    const target = readTarget(state.document, state.selection.ids)

    if (target === undefined || !target.properties.includes(property)) {
      return
    }

    state.dispatch(
      commands.setProp({
        nodeId: target.nodeId,
        path: ESCAPE_HATCH_PROP,
        value: withDeclaration(target.css, property, value),
      }),
    )
  })

  useStudioStore.subscribe(publish)
  publish()
}
