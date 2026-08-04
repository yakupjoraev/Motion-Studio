# 47 — Playground sandboxes

**Milestone** M10 · **Depends on** 46 · **Commit** `feat(web): add playground with property sandboxes`

## Read first

- `docs/PLAYGROUND.md` — § Layout, § Property sandboxes, § Editor, § Presets
- `docs/PERFORMANCE.md` — § Mandatory dynamic imports
- `docs/ACCESSIBILITY.md` — § Playground

## Goal

`/playground` — eight purpose-built CSS sandboxes with a live editor. A generic "type CSS here" box is
not useful; each property gets an environment designed for it.

## Deliverables

```
apps/web/
├── app/playground/
│   ├── page.tsx                    server shell
│   └── playground-client.tsx
└── src/components/playground/
    ├── playground-layout.tsx        property list | target | presets, editor below
    ├── property-list.tsx            role=radiogroup, arrow navigation
    ├── code-editor.tsx              CodeMirror 6, dynamically imported
    ├── editor-skeleton.tsx          exact-height placeholder
    ├── preset-panel.tsx
    ├── targets/
    │   ├── background-target.tsx     full-bleed rectangle
    │   ├── shadow-target.tsx         card on a mid-tone surface
    │   ├── filter-target.tsx         image + text + gradient
    │   ├── backdrop-target.tsx       glass panel over a busy photo, swatch picker
    │   ├── mask-target.tsx           image with checkerboard, three view modes
    │   ├── clip-path-target.tsx      block with a grid overlay
    │   ├── transform-target.tsx      card in a perspective container
    │   └── transition-target.tsx     two-state element with play/scrub/loop
    ├── target-frame.tsx             resizable by dragging edges
    └── use-apply-css.ts             debounced apply with last-valid retention
```

## Constraints

### Each target is designed for its property

The generic mistake is one preview box for everything. A `box-shadow` needs a card on a mid-tone
surface (shadows are invisible on white and on black); a `backdrop-filter` needs something busy behind
it; a `mask-image` needs a checkerboard so you can see what was removed. Build each one for its job —
the table in `PLAYGROUND.md` § Property sandboxes is the specification.

### The target frame is resizable

Drag its edges to resize. This matters: a `clip-path` polygon that looks right at 400 × 300 and wrong
at 800 × 200 is exactly the bug the playground should surface. Keyboard-resizable too (focus the
handle, arrows, with an announced size).

### Apply, and keep the last valid state

```ts
export function useApplyCss(property: string, targetRef: RefObject<HTMLElement>) {
  // debounce 60ms; validate; on success apply and remember; on failure keep the previous applied value
}
```

**On invalid CSS the preview keeps rendering the last valid value.** Blanking the preview on a typo is
hostile — you lose the thing you were comparing against. The editor shows the error; the preview stays
useful.

Apply by setting the property on the target **element**, never by injecting a stylesheet and never via
`innerHTML`.

### CodeMirror

Dynamically imported with a skeleton at the **exact final height** so there is no layout shift. ~110 kB
for the CSS setup, which is why it is nowhere near the studio's initial chunk.

Configuration:
- CSS language mode with value autocomplete
- Inline colour swatches that open a picker
- Our theme, generated from the tokens
- Diagnostics as inline underlines plus a gutter marker
- `Cmd+Enter` applies immediately, otherwise the 60 ms debounce
- Bracket matching, auto-close, `Cmd+/`, `Cmd+D`

### Presets

The full table from `PLAYGROUND.md` § Presets. Click replaces; `Alt+click` appends as a layer where the
property is layerable (`background`, `box-shadow`, `mask-image`, `filter`).

Every preset is a labelled button; the swatch is `aria-hidden`.

### Accessibility

- Property list: `role="radiogroup"`, arrow navigation, current property announced
- CodeMirror gets an `aria-label`
- Diagnostics in an `aria-live="polite"` region debounced 500 ms — narrating every keystroke's syntax
  error is worse than silence
- Target frame resize handles are focusable with announced sizes
- Compare mode (prompt 49) announces which half is active

### Performance

- One target element only; `contain: paint` on it
- `backdrop-filter` and large blurs are expensive — one instance is fine, and the sandbox never renders
  more than one
- Animation sandboxes pause when the tab is hidden
- Under reduced motion, the transition sandbox shows static start/end states with a manual scrub

## Verify

```bash
pnpm test
pnpm build     # confirm CodeMirror is a separate chunk
pnpm dev       # /playground
```

Tests:
- `useApplyCss`: valid → applied; invalid → previous value retained; debounce honoured
- Each target renders and accepts a value
- Property list keyboard navigation
- Preset click replaces; `Alt+click` appends for layerable properties only
- Skeleton height matches the editor's final height (no CLS)

Manual, and report:
- Each of the eight sandboxes: type a value, see it apply
- `box-shadow` on the mid-tone card → the shadow is actually visible (this is the point of that target)
- `backdrop-filter` over the busy photo → the effect reads correctly
- `mask-image` with the checkerboard → you can see what was removed; all three view modes work
- Type invalid CSS → error underlines, **preview keeps the last valid render**
- Resize the target frame → the value re-renders at the new size; keyboard resize announces the size
- Reduced motion → the transition sandbox is scrubbable, not auto-playing
- Lighthouse on `/playground` → report all four scores and the first-load JS

## Done when

- [ ] Eight sandboxes, each with a purpose-built target per the doc's table
- [ ] Target frame resizable by mouse and keyboard, with announced sizes
- [ ] Invalid CSS retains the last valid render — verified
- [ ] Applied to the element, never via a stylesheet or `innerHTML`
- [ ] CodeMirror dynamically imported with a zero-CLS skeleton; confirmed as its own chunk
- [ ] Full preset table implemented with layer-append for layerable properties
- [ ] Property list and diagnostics fully accessible with debounced announcements
- [ ] Lighthouse scores and first-load JS reported
