---
group: Subsystems
order: 5
summary: Breakpoints, prop overrides, resolution, preview device frames
---

# RESPONSIVE_ENGINE

Responsive design in a visual editor has one hard requirement: **the user edits at one
breakpoint and the others must not silently break**. The model is base props plus sparse
overrides — never a separate document per breakpoint.

## Breakpoints

Tailwind's scale, so exported classes are idiomatic:

```ts
export const BREAKPOINTS = {
  base: { id: 'base', label: 'Base',    min: 0,    frame: 375,  prefix: ''     },
  sm:   { id: 'sm',   label: 'Small',   min: 640,  frame: 640,  prefix: 'sm:'  },
  md:   { id: 'md',   label: 'Medium',  min: 768,  frame: 768,  prefix: 'md:'  },
  lg:   { id: 'lg',   label: 'Large',   min: 1024, frame: 1024, prefix: 'lg:'  },
  xl:   { id: 'xl',   label: 'XL',      min: 1280, frame: 1280, prefix: 'xl:'  },
  '2xl':{ id: '2xl',  label: '2XL',     min: 1536, frame: 1536, prefix: '2xl:' },
} as const
```

**Mobile-first.** `base` is the unconditional value; every other breakpoint is an override that
applies at its `min` width and above. This matches Tailwind, matches CSS, and means the export
is a direct translation rather than a re-derivation.

## Storage

```ts
interface Node {
  props: Record<string, unknown>                                   // base
  responsive: Partial<Record<BreakpointId, Record<string, unknown>>>  // sparse overrides
}
```

```json
{
  "props": { "columns": 1, "gap": 16, "align": "center", "title": "Ship faster" },
  "responsive": {
    "md": { "columns": 2, "align": "left" },
    "lg": { "columns": 3, "gap": 24 }
  }
}
```

Only overridden keys are stored. A document where nothing is overridden has empty `responsive`
objects and costs nothing.

## Resolution

```ts
export function resolveResponsiveProps<P extends object>(
  node: Node,
  breakpoint: BreakpointId,
): P {
  let resolved = { ...node.props }
  for (const bp of CASCADE_ORDER) {          // ['base','sm','md','lg','xl','2xl']
    if (BREAKPOINTS[bp].min > BREAKPOINTS[breakpoint].min) break
    const override = node.responsive[bp]
    if (override) resolved = { ...resolved, ...override }
  }
  return resolved as P
}
```

Cascading, not exact-match. Editing at `lg` while `md` has an override means `lg` inherits the
`md` value — exactly like CSS. Getting this wrong (resolving only the exact breakpoint) is the
single most common bug in this class of tool, and it produces a document that looks right in the
editor and broken in the browser.

Memoised per `(nodeId, version, breakpoint)`.

## Editing semantics

The active breakpoint determines where an edit lands:

| Active | Edit writes to |
| --- | --- |
| `base` | `props` — affects every breakpoint that does not override |
| anything else | `responsive[bp]` — affects that breakpoint and up |

The inspector makes this unmistakable:

```
┌──────────────────────────────────────┐
│  base   sm   [md]   lg   xl   2xl    │   active breakpoint, prominent
│  Editing md and up                   │   plain-language reminder
├──────────────────────────────────────┤
│ • Columns    [ 2 ]           ⟳       │   • = overridden here
│   Gap        [ 16 ]                  │       inherited from base
│ · Align      [ left ]                │   · = inherited from a smaller bp
└──────────────────────────────────────┘
```

- `•` accent dot: overridden at the active breakpoint. `⟳` removes the override.
- `·` muted dot with a tooltip: inherited from `md` (naming the source breakpoint).
- No marker: the base value.
- Editing an inherited value at a non-base breakpoint creates a new override, and the dot appears
  immediately — the feedback loop closes in the same frame.

**Guardrail.** If a user has spent more than ~30 seconds editing at a non-base breakpoint and
every edit is creating overrides, the panel shows a one-line hint: "You're editing `md` and up.
Switch to base to change all sizes." Shown once per session, dismissible. Users who do not
realise which breakpoint they are editing produce documents full of accidental overrides, and a
gentle nudge prevents an hour of confusion.

## Canvas preview

- The artboard width equals `BREAKPOINTS[active].frame`. Switching breakpoints animates the width
  over 200 ms (`standard` easing), which makes reflow legible rather than jarring.
- The frame outline shows the breakpoint name and pixel width.
- `base` renders at 375 px — a real phone width, not a shrunken desktop.
- A `Fit` zoom keeps the frame in view when switching to a wider breakpoint.
- Optional **multi-frame mode**: render `base`, `md`, and `xl` side by side, read-only, for
  comparison. Selection syncs across frames; editing happens in the active frame only. Off by
  default because three live frames triples render cost.

## Which properties are responsive

Declared per control via `responsive: true`. Guidance:

| Responsive | Not responsive |
| --- | --- |
| columns, gap, padding, margin | text content |
| font size, line height | link URLs |
| direction, align, justify | list items |
| width, height, aspect ratio | colours (theme handles those) |
| visibility (`hidden` per breakpoint) | motion presets |
| image `sizes` / aspect | block variant, in most cases |

Motion is deliberately not responsive: a different animation per breakpoint is almost always a
mistake, and the one legitimate case — disable on mobile — is covered by a `disableBelow` param
on the spec.

`hidden` is responsive and stored as a prop, not the node flag: `props.hidden` with
`responsive.md.hidden = false` emits `hidden md:block`.

## Codegen

Overrides become Tailwind prefixed classes:

```ts
// node
{ props: { columns: 1, gap: 16 }, responsive: { md: { columns: 2 }, lg: { columns: 3, gap: 24 } } }

// emitted
className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 lg:gap-6"
```

The block's markup producer answers what each breakpoint looks like — it is a pure function of its
props, so the export runs it once per breakpoint and compares the trees (ADR-252). The five rules are
unchanged; what answers them is that comparison rather than a declared class map.

Rules in `buildIR`:

1. Base props emit unprefixed classes.
2. Each override emits `{prefix}{class}` for the classes it adds.
3. Classes are ordered `base → sm → md → lg → xl → 2xl` so the cascade is readable and matches
   what Tailwind's own class sorter would produce.
4. An override equal to the inherited value is **dropped** — a user who set `md:columns = 1` when
   base is already `1` should not get dead classes in their export.
5. A value with no Tailwind equivalent is an inline declaration, and one that differs by breakpoint
   becomes a generated class plus a media query in the emitted stylesheet, not an arbitrary-value
   class soup.

Golden-file tests cover: base only, one override, multiple overrides, redundant override
elimination, and the arbitrary-value fallback.

## Container queries

Blocks that are placed inside variable-width containers (cards in a bento grid) respond to their
container, not the viewport. Those blocks opt in:

```ts
capabilities: { containerQuery: true }
```

Which emits `@container` and `@sm:`/`@md:` classes with a `container-type: inline-size` wrapper.
Available for: `feature-grid` cells, `bento-grid` items, `stat-grid` items, `testimonial-card`.

**The block draws that wrapper, not the canvas** (ADR-184). The capability is a declaration the
inspector and this engine read; the containment element is part of the block's own markup, because a
containment element the canvas added would exist in the preview and not in the export, and the cell
would read `@md:` in the studio and nothing at all after export.

Not the default — container queries in a canvas that is itself scaled by a transform behave
subtly differently from a real page, and using them everywhere would make the preview less
trustworthy. Concretely: a `@container` reports the **untransformed** inline size, so a cell 320 px
wide at zoom 0.5 answers the query for 320. That is what the exported page does; the preview is the
surface that is slightly wrong, and only the blocks that need cell-relative sizing pay for it.

## Testing

**Unit** — `resolveResponsiveProps`:
- base only → base values
- exact-breakpoint override → applied
- cascade: `md` override visible at `lg` and `xl`
- `lg` override does not leak down to `md`
- multiple overrides on the same key resolve to the largest applicable
- unknown breakpoint key ignored rather than throwing

**Unit** — codegen class generation, including redundant-override elimination.

**E2E**:
1. Set `columns` at `base`, switch to `md`, verify the value inherited.
2. Override at `md`, switch back to `base`, verify base unchanged.
3. Override, then reset, verify the override key is removed from `responsive` (not set to the
   base value — a stale key would emit a dead class).
4. Export and assert the emitted className string exactly.
