'use client'

import { recordGesture } from './error-context'

/**
 * The gesture half of the error context — `prompts/58` § Error report.
 *
 * Two listeners on the window in the capture phase, so a gesture is recorded even when the handler
 * that runs next is the one that throws: a crash caused by a click must still say which click.
 *
 * **Nothing the user typed is recorded.** A gesture is written in the application's words — the test
 * id of the control, the shortcut that was pressed — and a printable key with no modifier is written
 * as `type`, without the character. A report is pasted into a public issue, and a keystroke log is
 * the one thing in this app that would carry the user's own text out of it.
 */
const INTERACTIVE =
  'button, a, input, select, textarea, summary, [role="button"], [role="menuitem"], [role="menuitemcheckbox"], [role="tab"], [role="option"], [role="switch"], [role="slider"]'

/** Held down rather than pressed: recording them would fill the buffer before the real key arrives. */
const HELD = new Set(['Shift', 'Control', 'Alt', 'Meta'])

/**
 * The control's test id, its role, or its tag — in that order, and never its text.
 *
 * The test ids are literals in the source (`export-open`, `layer-row`), so they name a control
 * without carrying anything from the document. An accessible name would read better and would also
 * be the node's name, which is the user's content.
 */
const describeTarget = (target: EventTarget | null): string => {
  if (!(target instanceof Element)) {
    return 'unknown'
  }

  const control = target.closest(INTERACTIVE) ?? target
  const identified = control.closest('[data-testid]')

  if (identified !== null) {
    return identified.getAttribute('data-testid') ?? 'unknown'
  }

  return control.getAttribute('role') ?? control.tagName.toLowerCase()
}

const describeKey = (event: KeyboardEvent): string | null => {
  if (HELD.has(event.key)) {
    return null
  }

  // `Shift` alone does not make a shortcut — it makes a capital letter, which is text.
  const shortcut = event.ctrlKey || event.metaKey || event.altKey

  if (event.key.length === 1 && !shortcut) {
    return 'type'
  }

  const parts = [
    event.ctrlKey || event.metaKey ? 'Mod' : null,
    event.altKey ? 'Alt' : null,
    event.shiftKey ? 'Shift' : null,
    event.key.length === 1 ? event.key.toLowerCase() : event.key,
  ].filter((part) => part !== null)

  return `press ${parts.join('+')}`
}

/** Returns its own teardown, so a shell that unmounts in a test leaves no listener behind. */
export function watchGestures(target: Window = window): () => void {
  const onPointerDown = (event: Event): void => {
    recordGesture(`click ${describeTarget(event.target)}`)
  }

  const onKeyDown = (event: KeyboardEvent): void => {
    const label = describeKey(event)

    if (label !== null) {
      recordGesture(label)
    }
  }

  target.addEventListener('pointerdown', onPointerDown, true)
  target.addEventListener('keydown', onKeyDown, true)

  return () => {
    target.removeEventListener('pointerdown', onPointerDown, true)
    target.removeEventListener('keydown', onKeyDown, true)
  }
}
