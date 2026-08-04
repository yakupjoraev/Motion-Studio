# SHORTCUTS

The studio is keyboard-first. A power user should never need the mouse except on the canvas, and
even the canvas is fully operable without one.

Notation: `Mod` = `Cmd` on macOS, `Ctrl` elsewhere. Resolved at runtime; never hard-coded.

## Global

| Shortcut | Action |
| --- | --- |
| `Mod+K` | Command palette |
| `Mod+Z` | Undo |
| `Mod+Shift+Z` / `Mod+Y` | Redo |
| `Mod+S` | Save (download `.motion`) |
| `Mod+O` | Open `.motion` |
| `Mod+Shift+E` | Export dialog |
| `Mod+,` | Settings |
| `Mod+/` | Shortcut reference |
| `Mod+\` | Toggle left panel |
| `Mod+Alt+\` | Toggle inspector |
| `Mod+.` | Toggle both panels (presentation mode) |
| `F2` | Cycle focus: canvas → left → inspector → canvas |
| `Esc` | Close overlay / exit isolation / clear selection |

## Selection

| Shortcut | Action |
| --- | --- |
| `Click` | Select |
| `Shift+Click` | Add to selection |
| `Mod+Click` | Toggle in selection |
| `Alt+Click` | Select the deepest node under the cursor, ignoring isolation |
| `Drag` on empty space | Marquee (intersect) |
| `Alt+Drag` on empty space | Marquee (contain only) |
| `Mod+A` | Select all siblings at the current level |
| `Mod+Shift+A` | Deselect all |
| `Tab` | Next sibling |
| `Shift+Tab` | Previous sibling |
| `Enter` | Enter container |
| `Esc` | Exit container |
| `Mod+Shift+↑` | Select parent |
| `Mod+Shift+↓` | Select first child |

## Editing

| Shortcut | Action |
| --- | --- |
| `Mod+D` | Duplicate |
| `Mod+C` | Copy |
| `Mod+X` | Cut |
| `Mod+V` | Paste |
| `Mod+Shift+V` | Paste in place (same parent, same index) |
| `Mod+Alt+V` | Paste style only |
| `Delete` / `Backspace` | Delete |
| `Mod+G` | Wrap in container |
| `Mod+Shift+G` | Unwrap |
| `F2` (with selection) | Rename |
| `Mod+Shift+H` | Toggle visibility |
| `Mod+Shift+L` | Toggle lock |
| `Mod+]` | Bring forward |
| `Mod+[` | Send backward |
| `Mod+Alt+]` | Bring to front |
| `Mod+Alt+[` | Send to back |

## Transform

| Shortcut | Action |
| --- | --- |
| `↑ ↓ ← →` | Nudge 1 px |
| `Shift` + arrows | Nudge 10 px |
| `Alt` + arrows | Nudge by grid size |
| `Mod+Alt+←` `→` | Decrease / increase width by 1 |
| `Mod+Alt+↑` `↓` | Decrease / increase height by 1 |

## Alignment

Applies to the selection, or to the parent when only one node is selected.

| Shortcut | Action |
| --- | --- |
| `Alt+A` | Align left |
| `Alt+D` | Align right |
| `Alt+H` | Align horizontal centres |
| `Alt+W` | Align top |
| `Alt+S` | Align bottom |
| `Alt+V` | Align vertical centres |
| `Alt+Shift+H` | Distribute horizontally |
| `Alt+Shift+V` | Distribute vertically |

## Viewport

| Shortcut | Action |
| --- | --- |
| `Space` (hold) + drag | Pan |
| Middle-mouse drag | Pan |
| `Mod+scroll` | Zoom at cursor |
| Pinch | Zoom at cursor |
| `Mod+=` / `Mod+-` | Zoom in / out |
| `Mod+0` | Zoom 100 % |
| `Shift+1` | Fit document |
| `Shift+2` | Zoom to selection |
| `Mod+'` | Toggle grid |
| `Mod+Shift+'` | Toggle snapping |
| `Mod+R` | Toggle rulers |
| `Mod+P` | Toggle motion playback |
| `Mod+Shift+P` | Replay entrance animations |

## Breakpoints

| Shortcut | Action |
| --- | --- |
| `Mod+1` … `Mod+6` | base / sm / md / lg / xl / 2xl |
| `Mod+Shift+M` | Toggle multi-frame comparison |

## Panels

| Shortcut | Action |
| --- | --- |
| `Alt+1` | Blocks |
| `Alt+2` | Motion |
| `Alt+3` | Effects |
| `Alt+4` | Theme |
| `Alt+5` | Layers |
| `Mod+F` | Focus block search |
| `Mod+Shift+F` | Focus layer search |

## Inspector

| Shortcut | Action |
| --- | --- |
| `Tab` / `Shift+Tab` | Next / previous control |
| `↑` / `↓` in a number field | ±1 step |
| `Shift+↑` / `↓` | ±10 steps |
| `Alt+↑` / `↓` | ±0.1 step |
| `Enter` | Commit |
| `Esc` | Revert to the value at focus time |
| Drag horizontally on a number field | Scrub |
| `Shift` while scrubbing | ×10 |
| `Alt` while scrubbing | ×0.1 |
| `Mod+Backspace` on a control | Reset to block default |
| `Alt+Backspace` on a control | Remove the breakpoint override |

## Layers tree

| Shortcut | Action |
| --- | --- |
| `↑` / `↓` | Move focus |
| `←` / `→` | Collapse / expand |
| `Shift+↑` / `↓` | Extend selection |
| `Enter` | Rename |
| `Space` | Toggle selection |
| `Mod+↑` / `↓` | Move the layer up / down among siblings |
| `Alt+Click` a disclosure | Expand or collapse the whole subtree |

## Drag with the keyboard

| Shortcut | Action |
| --- | --- |
| `Space` / `Enter` on a focused block card or layer row | Pick up |
| Arrows | Move between drop positions |
| `Space` / `Enter` | Drop |
| `Esc` | Cancel |

## Playground

| Shortcut | Action |
| --- | --- |
| `Mod+Enter` | Apply immediately |
| `Mod+Shift+S` | Swap A/B in compare mode |
| `Mod+Shift+C` | Copy CSS |
| `Mod+Shift+K` | Send to selection |
| `↑` `↓` on the property list | Change property |

## Implementation

### The shortcut registry

One central registry, no scattered `keydown` listeners.

```ts
// packages/hooks/src/shortcuts/registry.ts
export interface Shortcut {
  readonly id: string
  readonly keys: string                  // 'mod+shift+z'
  readonly label: string                 // 'Redo'
  readonly group: ShortcutGroup
  readonly scope: ShortcutScope
  readonly when?: (ctx: ShortcutContext) => boolean
  readonly preventDefault?: boolean
  run(ctx: ShortcutContext): void
}

export type ShortcutScope = 'global' | 'canvas' | 'inspector' | 'layers' | 'playground' | 'dialog'
```

Why a registry rather than handlers:

1. The command palette is generated from it — every shortcut is discoverable without a second
   list to maintain.
2. The `Mod+/` reference sheet is generated from it.
3. Conflicts are detectable: a startup assertion fails in development if two shortcuts share
   `keys` within an overlapping scope.
4. Rebinding becomes possible later without touching any handler.

### Resolution order

```
keydown
   │
   ├─ Is the target a text input / textarea / contenteditable?
   │     └─ Yes → only allow `escape`, `mod+enter`, `mod+s`, `mod+z` (native undo in the field)
   │
   ├─ Is a modal dialog open?
   │     └─ Yes → 'dialog' scope only
   │
   ├─ Which scope owns focus?  (data-shortcut-scope on the focused subtree)
   │
   ├─ Match: scope shortcuts first, then 'global'
   │
   ├─ Evaluate `when(ctx)`
   │
   └─ Run; call preventDefault if declared
```

The text-input guard is the rule that prevents the classic bug of `Delete` removing a node while
the user is editing a text prop.

### Platform normalization

```ts
export function normalizeKeys(event: KeyboardEvent): string
```

- `mod` maps to `metaKey` on macOS and `ctrlKey` elsewhere. `Mod+Z` written once works on both.
- Modifier order is canonical: `mod+alt+shift+key`.
- Uses `event.code` for physical keys (arrows, `Space`) and `event.key` for characters, so a
  non-US layout does not break arrow navigation.
- Display strings are platform-aware: `⌘⇧Z` on macOS, `Ctrl+Shift+Z` elsewhere, in tooltips, the
  palette, and the reference sheet.

### Command palette

```ts
export interface PaletteItem {
  id: string
  label: string
  group: 'Insert' | 'Motion' | 'Edit' | 'View' | 'Theme' | 'Layer' | 'Document' | 'Help'
  keywords: readonly string[]
  shortcut?: string
  icon?: IconName
  run(): void
}
```

Sources: every registered shortcut, every block (as "Insert X"), every motion preset (as
"Apply X"), every theme preset, every layer (as "Select X"), every doc page.

- Fuzzy match on label + keywords, scoring by consecutive-character runs and word-boundary hits.
- Recent items first (last 5, persisted), then score order.
- Grouped headers, arrow navigation, `Enter` runs, `Esc` closes, `Tab` does nothing (so focus
  cannot escape the palette).
- Virtualized — the list can exceed 300 items with the layer source.
- Opens in under 50 ms with the item list precomputed and memoised on `version`.

### Reference sheet

`Mod+/` opens a dialog generated from the registry, grouped, showing platform-correct key
displays and greying out shortcuts whose `when` currently fails. Searchable. This is the only
documentation of shortcuts that cannot go stale, because it is the source data.

## Accessibility notes

- Every shortcut has a non-keyboard equivalent — a menu item, a button, or a palette entry. A
  keyboard shortcut is never the only way to do something.
- No shortcut requires more than three simultaneous keys.
- No single-letter shortcuts without a modifier outside the canvas, so typing in a field is never
  ambiguous.
- Shortcuts that change state announce the result in a live region: "Grid hidden", "Snapping on".
- `Space`-hold-to-pan releases correctly on window blur — otherwise the studio gets stuck in pan
  mode, which is a real bug in several shipped design tools.

## Testing

**Unit** — `normalizeKeys` for both platforms, all modifier combinations, `code` vs `key`
handling. Conflict detection across the full registry. Fuzzy-match scoring against a fixture of
queries and expected orders.

**E2E** — every shortcut in the tables above is exercised at least once, asserting the resulting
state. Plus specifically:
- `Delete` while editing text does not delete the node.
- `Mod+Z` inside a text field does a native field undo, not a document undo.
- `Space`-pan releases on window blur.
- The palette opens, filters, and runs an insert command.
- Focus returns to the trigger after every dialog closes.
