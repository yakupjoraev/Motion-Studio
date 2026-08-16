'use client'

import { useEffect, useState } from 'react'

/** DESIGN_SYSTEM.md § Glass rule 2, and PERFORMANCE.md § Layer count: four at once, in the viewport. */
export const BACKDROP_CAP = 4

/** How the count reads a surface. Injected because jsdom does not implement `backdrop-filter` at all. */
export type ReadBackdrop = (element: Element) => string

const readComputed: ReadBackdrop = (element) => getComputedStyle(element).backdropFilter ?? ''

export function countGlass(root: ParentNode, read: ReadBackdrop = readComputed): number {
  let total = 0

  for (const element of root.querySelectorAll('*')) {
    const filter = read(element)

    if (filter !== '' && filter !== 'none') {
      total += 1
    }
  }

  return total
}

/**
 * How many glass surfaces the canvas is compositing. "The canvas counts them and warns past the cap"
 * — the count is taken from the computed style rather than from a registry of blocks, because
 * `backdrop-filter` is what costs, whoever wrote it: a block, a theme, or a user's raw CSS.
 *
 * Recounted on a mutation rather than on a frame: a `MutationObserver` fires when the tree or a style
 * attribute changes, which is exactly when the answer can differ, and costs nothing while a user is
 * only panning.
 */
export function useBackdropCount(
  selector = '[data-testid="canvas-root"]',
  read?: ReadBackdrop,
): number {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let frame: number | null = null

    /*
     * The root is looked up per recount rather than once. The status bar mounts with the shell and
     * the canvas is a `ssr: false` island below it, so at the moment this effect first runs there is
     * usually no canvas yet — measured: the warning never appeared, because the observer had been
     * attached to nothing.
     */
    const recount = (): void => {
      if (frame !== null) {
        return
      }

      frame = requestAnimationFrame(() => {
        frame = null

        const root = document.querySelector(selector)

        setCount(root === null ? 0 : countGlass(root, read))
      })
    }

    recount()

    const observer = new MutationObserver(recount)

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style'],
    })

    return () => {
      observer.disconnect()

      if (frame !== null) {
        cancelAnimationFrame(frame)
      }
    }
  }, [selector, read])

  return count
}
