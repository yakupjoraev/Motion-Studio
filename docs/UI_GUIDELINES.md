# UI_GUIDELINES

How the studio itself looks and feels. [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md) owns the tokens;
this document owns the judgement.

## Character

The studio is a **professional instrument**. Dark by default, dense, quiet, precise. The
interface never competes with the canvas — the user's work is the only thing allowed to be
colourful.

Reference points: Linear's restraint, Figma's density, Vercel's typographic discipline. Not:
gradient-heavy dashboards, cards floating on cards, decorative illustration in chrome.

**[impeccable.style](https://impeccable.style) is the product's primary design reference** and it
applies here too — but as a standard of *craft*, not of loudness. From it the chrome takes surface
precision, hairline treatment, glass on floating panels, micro-interaction feel, motion character,
and typographic exactness. It does not take animated gradients, decorative glow, or cursor effects.
See [DESIGN_REFERENCES.md](DESIGN_REFERENCES.md) § Applying it per surface — the content surfaces
(landing, gallery, blocks, effects) apply it at full strength; the chrome applies it quietly.

The test that settles any argument: screenshot the studio with a document open. Your eye should go
to the user's design, not to our panels.

Concretely:
- Chrome is `surface-0`/`surface-1` with hairline borders. No shadows in the panels — depth
  comes from value, not from elevation.
- Exactly **one** accent colour in the chrome, used only for: selection, focus, active tab, and
  primary action. Everything else is neutral.
- No gradients in chrome. Gradients are content.
- Icons are 16 px in panels, 20 px in the toolbar. Never larger.
- Empty states are one sentence and one action. No illustrations.

## Layout

```
┌──────────────────────────────────────────────────────────────────────┐ 48px  top bar
├────────────┬──────────────────────────────────────┬──────────────────┤
│            │                                      │                  │
│  left      │              canvas                  │   inspector      │
│  240–360   │              flexible                │   280–420        │
│  default   │                                      │   default 320    │
│  280       │                                      │                  │
│            │                                      │                  │
├────────────┴──────────────────────────────────────┴──────────────────┤ 28px  status bar
└──────────────────────────────────────────────────────────────────────┘
```

- Panels resize by dragging their inner edge; the handle is 4 px wide with an 8 px hit area.
- Widths persist to `localStorage`.
- Below 1280 px, panels become overlays triggered from the top bar. The studio is a desktop
  tool and says so below 1024 px with a readable notice — it does not pretend to work.
- The canvas never scrolls the page. `overscroll-behavior: none` on the app root.

### Density scale

| Element | Height |
| --- | --- |
| Top bar | 48px |
| Status bar | 28px |
| Panel tab strip | 36px |
| Section header | 32px |
| Control row | 28px |
| Input / select | 26px |
| Small button | 24px |
| Icon button | 28 × 28 |
| Layer row | 26px |
| Block card | 88px |

Row height 28 px with `text-xs` labels is the studio's rhythm. Everything else follows it.

### Control glyphs

The table above sizes rows. These are the marks drawn inside them — a checkbox box, a switch
track, a slider thumb. None of them is a free choice: each is derived from a number already in the
scale, so the glyphs stay on the same rhythm as the rows that hold them.

| Glyph | Size | Derived from |
| --- | --- | --- |
| Checkbox box | 16 × 16 | the panel icon cell — the box is the frame of a 16 px check |
| Switch track | 24 × 14 | a small button wide, half a control row tall |
| Switch thumb | 10 × 10 | the track, inset 2 px on every side |
| Slider track | 4px | the panel resize handle — the chrome's thinnest interactive line |
| Slider thumb | 12 × 12 | half a small button |

**The glyph is what you see; the target is what you hit.** Every one of them sits inside a hit area
of at least 24 × 24 px, padded by its control — WCAG 2.2 AA § 2.5.8, which
[ACCESSIBILITY.md](ACCESSIBILITY.md) adopts whole. A 16 px checkbox with a 16 px target would be a
conformance failure wearing a tidy design.

## Panels

### Section headers

```
┌────────────────────────────────────┐
│ ▸ Layout                        ⟳  │   32px, text-xs, uppercase, tracking +0.06em
├────────────────────────────────────┤   foreground-muted, sticky on scroll
│  Display      [ flex        ▾ ]    │
│  Direction    [ ↓ ] [ → ]          │
│  Gap          [ 16 ]  ▤            │
└────────────────────────────────────┘
```

- Collapsible; open/closed state persists per section.
- The `⟳` reset appears only when a property in the section differs from the block default.
- Sticky headers while the panel scrolls.

### Control rows

Label left (fixed 88 px), control right (fills). Labels are `text-xs`,
`foreground-muted`, sentence case, no colon.

```
  Opacity      [────────●──]  [ 72 ]
  Radius       [ 12 ] 🔗 [ 12 ] [ 12 ] [ 12 ]
  Background   [■] linear-gradient(…)          ▸
  Blur         [  8 ]px
```

Rules:
- Label and control are one click target for focus purposes — clicking the label focuses the
  control.
- A number field is always a **scrub field**: horizontal drag changes the value, cursor becomes
  `ew-resize`, `Shift` ×10, `Alt` ×0.1, arrows step, typed expressions evaluate.
- Colour swatches are 20 × 20 with a checkerboard behind alpha.
- Linked values (radius, padding) show a chain toggle; unlinking reveals per-side fields.
- Overridden-at-breakpoint properties get a 4 px accent dot to the left of the label.

### Multi-selection

Shared properties render normally. Differing values render the placeholder `Mixed` in
`foreground-subtle`. Editing applies to all selected nodes as one transaction, one undo step.

## Canvas presentation

- Background: `canvas-bg`, one step darker than the panels, so the artboard reads as *behind*
  the chrome.
- Grid: 8 px dots at 8 % opacity; a heavier line every 80 px. Grid fades out below 50 % zoom and
  is hidden below 25 %.
- Selection outline: 1.5 px `canvas-selection`, drawn **outside** the node's box, plus a name
  chip at the top-left in `text-2xs` that flips below when it would clip the viewport top.
- Hover outline: 1 px, 50 % opacity, only when nothing is being dragged.
- Snap guides: 1 px `canvas-snap` lines that extend 24 px past the aligned edges, with a
  distance label when two edges are separated by a measurable gap.
- Resize handles: 8 × 8 squares at corners and midpoints, `surface-3` fill, `accent` border,
  only on single selection.
- Padding/margin visualization on `Alt` hold: padding tinted `accent/12`, margin `warning/12`.

All overlays are absolutely-positioned siblings of the node, never wrappers.
`pointer-events: none` except on handles.

## Interaction feel

### Timing

| Interaction | Duration | Easing |
| --- | --- | --- |
| Hover state | 120ms | `standard` |
| Press | 80ms | `accelerate` |
| Focus ring | 120ms | `standard` |
| Dropdown / popover open | 160ms | `decelerate` |
| Dropdown close | 120ms | `accelerate` |
| Dialog open | 220ms | `emphasized` |
| Panel collapse | 200ms | `standard` |
| Tab indicator | 200ms | `standard` (layout animation) |
| Toast in | 260ms | `spring` |
| Tooltip | 100ms after 500ms delay | `standard` |

Nothing in the chrome animates longer than 260 ms. Chrome animation is feedback, not
performance.

### Feedback rules

- **Immediate.** Every press changes something visually within one frame.
- **Optimistic.** Nothing waits for a computation to show a result. Export shows the dialog
  immediately and streams the generated files in.
- **Reversible.** Every destructive action is undoable, and the toast says so: "Deleted Hero ·
  Undo".
- **Quiet.** No success toast for expected outcomes. A copy button becomes a checkmark for
  1.2 s; that is enough.

### Cursors

| Context | Cursor |
| --- | --- |
| Canvas empty space | `default` |
| Over a node | `default` (selection is click, not grab) |
| Selected node body | `move` |
| Resize handle | directional `*-resize` |
| Pan mode (`Space` held) | `grab` / `grabbing` |
| Scrub field | `ew-resize` |
| Panel resize handle | `col-resize` |
| Text editing | `text` |

## Focus and keyboard

- Focus ring: `shadow-focus` (2 px surface offset + 2 px accent). Never `outline: none` without
  a replacement.
- `:focus-visible` only — no ring on mouse clicks.
- Every panel is a focus scope. `F2` cycles: canvas → left panel → inspector → canvas.
- Dialogs trap focus and restore it to the trigger on close.
- Roving tabindex in the toolbar, tab strips, and layer tree — one tab stop per group, arrows
  navigate inside.
- The canvas is a single tab stop; once focused, arrows nudge the selection (1 px, `Shift` = 10 px)
  and `Tab` walks siblings.

Full map: [SHORTCUTS.md](SHORTCUTS.md).

## Copy

**Voice:** direct, technical, no marketing. The user is a developer.

| Do | Don't |
| --- | --- |
| "Delete" | "Are you sure you want to delete this?" |
| "No blocks yet. Drag one from the left." | "Let's get started building something amazing!" |
| "Invalid CSS: unexpected `)` at 24" | "Oops! Something went wrong 😅" |
| "Copied" | "Successfully copied to clipboard!" |
| "Export React" | "Get your code" |

- Sentence case everywhere except section headers (uppercase) and proper nouns.
- Buttons are verbs: `Export`, `Duplicate`, `Reset`.
- Property labels match the CSS property they map to, so the user's existing knowledge
  transfers. `Backdrop blur`, not `Frosting`.
- Errors state what happened, where, and what to do. Three clauses, one sentence.
- No emoji in the product UI.

## Loading and empty states

| Situation | Treatment |
| --- | --- |
| Studio boot | Server-rendered chrome skeleton, then the canvas mounts. No spinner. |
| Empty canvas | Centred: "Drag a block to start" + `⌘K` hint. |
| No selection | Inspector shows document settings (theme, canvas size), not an empty panel. |
| Block thumbnail loading | Token-coloured skeleton at the exact final size. No layout shift. |
| Generating export | Dialog opens instantly, file list streams in with per-file skeletons. |
| Search no results | "No blocks match "xyz"" + a "clear" action. |

A spinner is an admission of failure. If something takes more than 200 ms, show partial results.

## Responsiveness of the chrome

The studio targets ≥ 1280 px. Between 1024 and 1280, panels overlay the canvas. Below 1024 the
app shows: "Motion Studio needs a wider screen. Browse the block gallery instead →". The
gallery, playground previews, docs, and landing are fully responsive at every width.

## Accessibility in chrome

Non-negotiable, per surface, detailed in [ACCESSIBILITY.md](ACCESSIBILITY.md):

- Every icon-only button has `aria-label` and a tooltip with the same text plus its shortcut.
- Tab strips are `role="tablist"` with arrow navigation.
- The layers tree is `role="tree"` with `aria-expanded`, `aria-level`, `aria-selected`.
- Canvas selection changes announce through a polite live region: "Hero selected, 1 of 6".
- Drag operations announce start, target, and result via dnd-kit's announcer.
- Colour is never the only signal — override dots pair with a title attribute, status colours
  pair with an icon.
