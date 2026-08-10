import { useEffect } from 'react'

/** The key both dnd-kit sensors treat as "cancel this drag". */
export const CANCEL_KEY = 'Escape'

/**
 * ADR-128. Leaving the window mid-drag has to cancel it (DRAG_AND_DROP.md § Auto-behaviours), and
 * dnd-kit cancels on `visibilitychange`, which switching applications does not fire. Its sensors keep
 * their cancel path private and the context exposes no imperative cancel, so the blur delivers the
 * same key the user would press — one mechanism that reaches both sensors and unwinds them properly.
 */
export function useCancelDragOnBlur(dragging: boolean): void {
  useEffect(() => {
    if (!dragging) {
      return
    }

    const cancel = (): void => {
      document.dispatchEvent(
        new KeyboardEvent('keydown', { key: CANCEL_KEY, code: CANCEL_KEY, bubbles: true }),
      )
    }

    window.addEventListener('blur', cancel)

    return () => {
      window.removeEventListener('blur', cancel)
    }
  }, [dragging])
}
