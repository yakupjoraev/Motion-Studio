'use client'

import { useEffect, useState } from 'react'

export const ANNOUNCER_CONTAINER_ID = 'ms-dnd-announcer'

/**
 * ACCESSIBILITY.md § Dialogs: a live region inside an `aria-hidden` subtree goes silent, and opening
 * a dialog hides everything that is not the dialog. The region therefore gets its own element on
 * `body`, outside the studio tree, rather than wherever the provider happens to be mounted.
 *
 * `null` until mounted, because the element cannot exist during a server render — and no drag can be
 * in flight before the first effect either.
 */
export function useAnnouncerContainer(): Element | null {
  const [container, setContainer] = useState<Element | null>(null)

  useEffect(() => {
    const element = document.createElement('div')
    element.id = ANNOUNCER_CONTAINER_ID
    document.body.append(element)
    setContainer(element)

    return () => {
      element.remove()
    }
  }, [])

  return container
}
