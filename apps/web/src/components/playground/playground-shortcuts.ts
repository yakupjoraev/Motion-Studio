import { type Shortcut, createShortcutRegistry } from '@motion-studio/hooks'

/**
 * SHORTCUTS.md § Playground. A registry of its own, mounted only on this page, which is why the scope
 * is `global`: on `/playground` there is nothing else for a key to belong to.
 *
 * All three declare `allowInTextEntry` (ADR-278). The surface they belong to is a code editor, and a
 * binding that dies the moment the editor takes focus is not a binding.
 */
export interface PlaygroundShortcutContext {
  swap(): void
  copyCss(): void
  send(): void
  readonly comparing: boolean
  readonly canSend: boolean
}

export const PLAYGROUND_SHORTCUTS: readonly Shortcut<PlaygroundShortcutContext>[] = [
  {
    id: 'playground-swap',
    keys: 'mod+shift+s',
    label: 'Swap A and B',
    group: 'Playground',
    scope: 'global',
    allowInTextEntry: true,
    when: (context) => context.comparing,
    run: (context) => context.swap(),
  },
  {
    id: 'playground-copy-css',
    keys: 'mod+shift+c',
    label: 'Copy CSS',
    group: 'Playground',
    scope: 'global',
    allowInTextEntry: true,
    run: (context) => context.copyCss(),
  },
  {
    id: 'playground-send',
    keys: 'mod+shift+k',
    label: 'Send to selection',
    group: 'Playground',
    scope: 'global',
    allowInTextEntry: true,
    when: (context) => context.canSend,
    run: (context) => context.send(),
  },
]

export const playgroundShortcuts = createShortcutRegistry(PLAYGROUND_SHORTCUTS)
