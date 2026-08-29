'use client'

import { Button } from '@motion-studio/ui'
import { type ReactElement, useCallback, useState, useSyncExternalStore } from 'react'

import { type EscapeHatchTarget, escapeHatchPort } from '../../store/escape-hatch-port'

import type { PlaygroundProperty } from './properties'

const subscribe = (listener: () => void): (() => void) => escapeHatchPort.subscribe(listener)
const snapshot = (): EscapeHatchTarget | undefined => escapeHatchPort.snapshot()
const serverSnapshot = (): EscapeHatchTarget | undefined => undefined

export interface SendAction {
  readonly target: EscapeHatchTarget | undefined
  readonly accepted: boolean
  readonly said: string
  readonly reason: string
  send: () => void
}

/**
 * PLAYGROUND.md § Send to selection. The value becomes the selected node's `css` prop through
 * `setProp`, so it is one undoable command and it shows up in the inspector.
 *
 * The studio's selection arrives over a port rather than from the store (ADR-279): this page must not
 * carry the block registry to find out whether something is selected.
 */
export function useSendToSelection(property: PlaygroundProperty, value: string): SendAction {
  const target = useSyncExternalStore(subscribe, snapshot, serverSnapshot)
  const [said, setSaid] = useState('')
  const accepted = target?.properties.includes(property) ?? false

  const send = useCallback(() => {
    if (target === undefined || !accepted) {
      return
    }

    setSaid(
      escapeHatchPort.write(property, value)
        ? `${property} sent to ${target.nodeName}. Undo in the studio removes it.`
        : 'The studio is not listening. Open it and select a block first.',
    )
  }, [accepted, property, target, value])

  return { target, accepted, said, reason: reasonFor(target, property, accepted), send }
}

export interface SendToSelectionProps {
  readonly action: SendAction
  readonly disabled: boolean
}

/** Why a property can be refused is on screen, not implied by a button that does nothing. */
export function SendToSelection({ action, disabled }: SendToSelectionProps): ReactElement {
  const { target, accepted, said, reason, send } = action

  return (
    <div className="flex flex-col gap-1">
      <Button
        size="sm"
        variant="secondary"
        onClick={send}
        disabled={disabled || target === undefined || !accepted}
        data-testid="send-to-selection"
      >
        {target === undefined ? 'Send to selection' : `Send to ${target.nodeName}`}
      </Button>
      <p className="m-0 text-2xs text-foreground-muted" data-testid="send-reason">
        {reason}
      </p>
      <output aria-live="polite" className="sr-only">
        {said}
      </output>
    </div>
  )
}

function reasonFor(
  target: EscapeHatchTarget | undefined,
  property: string,
  accepted: boolean,
): string {
  if (target === undefined) {
    return 'Select one block in the studio and this sends the value to it.'
  }

  if (!accepted) {
    return `${target.blockName} does not take ${property} from here: it is a property the block paints itself.`
  }

  return `Lands on ${target.nodeName} as a custom CSS chip.`
}
