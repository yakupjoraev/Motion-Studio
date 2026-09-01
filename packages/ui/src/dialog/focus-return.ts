/**
 * Where focus goes when an overlay closes — ACCESSIBILITY.md § Dialogs, "restored to the trigger".
 *
 * Radix restores to its own `Trigger`, and the studio's dialogs have none: they are opened from a
 * store flag or a shortcut, so `triggerRef` is null, Radix's handler prevents the focus scope's own
 * restore, and focus lands on `body` (ADR-325).
 *
 * The listener is module-level rather than per dialog because a dialog mounts at the moment it opens
 * (ADR-313) — later than the control that opened it was focused, so a listener it installs itself
 * never sees that control. Focus inside an overlay is ignored, which is what makes a dialog opened
 * from a menu item return to the menu's own trigger rather than to an item that no longer exists.
 */
let lastFocused: HTMLElement | null = null
let watching = false

const record = (event: FocusEvent): void => {
  const { target } = event

  if (target instanceof HTMLElement && target.closest('[data-ms-overlay]') === null) {
    lastFocused = target
  }
}

export function watchFocusReturn(): void {
  if (watching || typeof document === 'undefined') {
    return
  }

  watching = true
  document.addEventListener('focusin', record, true)
}

/** Null when the element has left the document — a node that is gone cannot take focus. */
export function focusReturnTarget(): HTMLElement | null {
  return lastFocused?.isConnected === true ? lastFocused : null
}
