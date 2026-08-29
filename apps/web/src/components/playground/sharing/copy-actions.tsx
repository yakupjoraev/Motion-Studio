'use client'

import { Button } from '@motion-studio/ui'
import { type ReactElement, useCallback, useState } from 'react'

import type { PlaygroundProperty } from '../properties'

import { encodePermalink } from './permalink'
import { toCssVariable, toTailwindClass } from './tailwind-class'

export interface CopyActions {
  readonly said: string
  copyCss: () => void
  copyTailwind: () => void
  copyVariable: () => void
  copyLink: () => void
}

/** PLAYGROUND.md § Sharing: three formats and a link, each one pasteable as it stands. */
export function useCopyActions(property: PlaygroundProperty, value: string): CopyActions {
  const [said, setSaid] = useState('')

  const copy = useCallback((text: string, message: string) => {
    void navigator.clipboard?.writeText(text).then(
      () => setSaid(message),
      () => setSaid('The clipboard refused. Select the value in the editor and copy it.'),
    )
  }, [])

  const copyCss = useCallback(
    () => copy(`${property}: ${value};`, 'CSS copied.'),
    [copy, property, value],
  )

  const copyTailwind = useCallback(() => {
    const tailwind = toTailwindClass(property, value)

    copy(
      tailwind.className,
      tailwind.note === undefined
        ? 'Tailwind class copied.'
        : `Tailwind class copied. ${tailwind.note}`,
    )
  }, [copy, property, value])

  const copyVariable = useCallback(
    () => copy(toCssVariable(property, value), 'CSS variable copied.'),
    [copy, property, value],
  )

  const copyLink = useCallback(() => {
    const link = encodePermalink({ property, value })

    if (!link.ok) {
      setSaid(`${link.error} Copy the CSS instead.`)

      return
    }

    window.history.replaceState(null, '', link.value)
    copy(`${window.location.origin}${window.location.pathname}${link.value}`, 'Link copied.')
  }, [copy, property, value])

  return { said, copyCss, copyTailwind, copyVariable, copyLink }
}

export interface CopyActionsBarProps {
  readonly actions: CopyActions
}

export function CopyActionsBar({ actions }: CopyActionsBarProps): ReactElement {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="secondary" onClick={actions.copyCss}>
          Copy CSS
        </Button>
        <Button size="sm" variant="secondary" onClick={actions.copyTailwind}>
          Copy as Tailwind
        </Button>
        <Button size="sm" variant="secondary" onClick={actions.copyVariable}>
          Copy as CSS variable
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={actions.copyLink}
          data-testid="copy-permalink"
        >
          Copy link
        </Button>
      </div>
      <output
        aria-live="polite"
        data-testid="copy-status"
        className="min-h-4 text-2xs text-foreground-muted"
      >
        {actions.said}
      </output>
    </div>
  )
}
