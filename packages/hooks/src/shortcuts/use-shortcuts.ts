import { useEffect, useRef } from 'react'

import { type Platform, currentPlatform, normalizeKeys } from './normalize-keys'
import {
  SHORTCUT_SCOPES,
  type Shortcut,
  type ShortcutRegistry,
  type ShortcutScope,
} from './registry'

/**
 * SHORTCUTS.md § Resolution order, in the order it is written. The guard comes first and it is the
 * reason the file exists: `Delete` while a user types a heading must reach the field, not the
 * document. Everything after it is scope resolution.
 */
/**
 * `mod+z` is deliberately absent. SHORTCUTS.md lists it among the keys a field may keep, and its
 * parenthetical says why: *native undo in the field*. Keeping it means **not** running the document's
 * undo — the guard blocking it is what leaves the browser's own field undo to happen. ADR-148.
 */
const TEXT_ENTRY_PASSTHROUGH = new Set(['escape', 'mod+enter', 'mod+s'])

/** Input types that hold text. A checkbox has no text to protect and should keep its shortcuts. */
const TEXT_INPUT_TYPES = new Set([
  'text',
  'search',
  'url',
  'tel',
  'email',
  'password',
  'number',
  'date',
  'datetime-local',
  'month',
  'time',
  'week',
  '',
])

export function isTextEntry(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false
  }

  // The attribute is read as well as the property: jsdom does not implement `isContentEditable`, and
  // a guard that only works in a browser is a guard no test can hold to account.
  const editable = target.getAttribute('contenteditable')

  if (target.isContentEditable || (editable !== null && editable !== 'false')) {
    return true
  }

  if (target.getAttribute('role') === 'textbox') {
    return true
  }

  if (target instanceof HTMLTextAreaElement) {
    return true
  }

  return target instanceof HTMLInputElement && TEXT_INPUT_TYPES.has(target.type.toLowerCase())
}

function isScope(value: string | null): value is ShortcutScope {
  return value !== null && (SHORTCUT_SCOPES as readonly string[]).includes(value)
}

/**
 * A dialog is modal, so it does not merely win over the other scopes — it replaces them. The marker
 * is the same `data-shortcut-scope` attribute the other surfaces carry, which keeps "what owns the
 * keyboard" a single question with a single answer.
 */
export function resolveScope(document: Document): ShortcutScope {
  if (document.querySelector('[data-shortcut-scope="dialog"]') !== null) {
    return 'dialog'
  }

  const active = document.activeElement

  if (!(active instanceof HTMLElement)) {
    return 'global'
  }

  const owner = active.closest('[data-shortcut-scope]')
  const declared = owner?.getAttribute('data-shortcut-scope') ?? null

  return isScope(declared) ? declared : 'global'
}

export interface ShortcutResolution<Ctx> {
  readonly keys: string
  readonly scope: ShortcutScope
  readonly shortcut: Shortcut<Ctx> | undefined
  readonly blockedByTextEntry: boolean
}

/** Pure, so the resolution order can be tested without a component and without a real key press. */
export function resolveShortcut<Ctx>(
  registry: ShortcutRegistry<Ctx>,
  event: KeyboardEvent,
  context: Ctx,
  platform: Platform,
  document: Document,
): ShortcutResolution<Ctx> {
  const keys = normalizeKeys(event, platform)
  const scope = resolveScope(document)

  if (keys === '') {
    return { keys, scope, shortcut: undefined, blockedByTextEntry: false }
  }

  if (isTextEntry(event.target) && !TEXT_ENTRY_PASSTHROUGH.has(keys)) {
    return { keys, scope, shortcut: undefined, blockedByTextEntry: true }
  }

  const shortcut = registry
    .match(keys, scope)
    .find((candidate) => candidate.when === undefined || candidate.when(context))

  return { keys, scope, shortcut, blockedByTextEntry: false }
}

export interface UseShortcutsOptions<Ctx> {
  readonly registry: ShortcutRegistry<Ctx>
  readonly context: Ctx
  readonly enabled?: boolean
  readonly platform?: Platform
  /** The document to listen on. Tests pass one in; the studio uses the ambient one. */
  readonly target?: Document | undefined
}

/**
 * One listener for the whole application. The context lives in a ref so a store update does not
 * detach and reattach it — a listener that churns on every keystroke is the thing this replaces.
 */
export function useShortcuts<Ctx>({
  registry,
  context,
  enabled = true,
  platform,
  target,
}: UseShortcutsOptions<Ctx>): void {
  const contextRef = useRef(context)
  contextRef.current = context

  useEffect(() => {
    const owner = target ?? (typeof document === 'undefined' ? undefined : document)

    if (!enabled || owner === undefined) {
      return
    }

    const resolvedPlatform = platform ?? currentPlatform()

    const onKeyDown = (event: KeyboardEvent): void => {
      const { shortcut } = resolveShortcut(
        registry,
        event,
        contextRef.current,
        resolvedPlatform,
        owner,
      )

      // A delegated binding is owned by its surface (ADR-150): matching it is how the registry
      // knows the key is taken, and standing aside is how the surface still gets it.
      if (shortcut === undefined || shortcut.delegated === true) {
        return
      }

      if (shortcut.preventDefault !== false) {
        event.preventDefault()
      }

      shortcut.run(contextRef.current)
    }

    owner.addEventListener('keydown', onKeyDown)

    return () => {
      owner.removeEventListener('keydown', onKeyDown)
    }
  }, [registry, enabled, platform, target])
}
