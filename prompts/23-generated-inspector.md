# 23 — Generated inspector

**Milestone** M4 · **Depends on** 09, 22 · **Commit** `feat(web): generate inspector from block schemas`

## Read first

- `docs/PRODUCT.md` — § 4. Inspector
- `docs/COMPONENT_LIBRARY.md` — § Controls drive the inspector, § Control kinds
- `docs/UI_GUIDELINES.md` — § Panels, § Multi-selection
- `docs/STATE_MANAGEMENT.md` — § Transient state
- `docs/ACCESSIBILITY.md` — § Inspector

## Goal

The inspector renders itself from the selected block's `controls` metadata. Adding a prop to a block
never means writing inspector UI again.

This is the payoff for the schema-first design, and it is where the "one undo step per drag"
requirement becomes real.

## Deliverables

```
apps/web/src/components/studio/inspector/
├── inspector.tsx                 root: routes on selection state
├── inspector-empty.tsx           no selection → document settings (theme, canvas)
├── inspector-multi.tsx           multi-selection: shared props, Mixed values
├── (control-renderer lives in packages/ui — see below, not here)
├── control-group.tsx             collapsible section, persisted, reset affordance
├── universal-sections/
│   ├── layout-section.tsx        display, direction, gap, padding, sizing, position
│   ├── style-section.tsx         background, border, radius, opacity, blend
│   ├── typography-section.tsx
│   ├── effects-section.tsx       shadow stack, blur, backdrop, glass, noise, glow, filter
│   └── code-section.tsx          live TSX of the selection (stub until prompt 44)
├── use-control-value.ts          read a resolved value for a path across the selection
├── use-control-commit.ts         onChange → CSS var; onCommit → coalesced command
└── *.test.tsx
```

## Constraints

### `ControlRenderer` goes in `packages/ui`, not in `apps/web`

Create it at `packages/ui/src/controls/control-renderer.tsx`. **Decided now, not later**, because
prompt 52 (block gallery) renders the same controls from the same `ControlDescriptor` metadata on a
public route. Building it inside the inspector and extracting it in prompt 52 would mean either a
risky refactor 29 prompts later or — far more likely — a second implementation that slowly stops
matching the studio.

It takes `descriptor`, `value`, `onChange`, `onCommit` and nothing store-shaped, so both consumers
supply their own state handling: the inspector dispatches commands, the gallery updates local state
and the URL.

A `switch` over `ControlDescriptor.kind` mapping to the components from prompt 09, exhaustive with
`assertNever`. Adding a control kind then breaks the build until it is handled — which is the
intended behaviour.

### `use-control-commit` — the load-bearing hook

```ts
export function useControlCommit(path: string, nodeIds: readonly NodeId[]) {
  const dispatch = useEditorStore((s) => s.dispatch)
  const breakpoint = useEditorStore(selectBreakpoint)

  const onChange = useCallback((value: unknown) => {
    // write the CSS variable on the target node element(s) — no React, no store
  }, [nodeIds])

  const onCommit = useCallback((value: unknown) => {
    const command = breakpoint === 'base'
      ? setProp({ nodeIds, path, value })
      : setResponsiveProp({ nodeIds, breakpoint, path, value })
    dispatch(command)     // coalesceKey includes path + breakpoint
  }, [dispatch, nodeIds, path, breakpoint])

  return { onChange, onCommit }
}
```

Two properties this must have, both tested:
1. A 200-px slider drag produces **zero** canvas re-renders during the drag.
2. That drag produces **exactly one** history entry.

Not every prop can be previewed via a CSS variable (text content, a layout switch). For those,
`onChange` falls through to a throttled `onCommit` at ~30 Hz, still coalescing into one entry. Say in
a comment which props take which path and why.

### Universal sections

These are not per-block; they read from a shared descriptor set applied to any block whose
`capabilities` allow them. A block that is not `resizable` does not get sizing controls. Derive that
from capabilities, not from a hard-coded block list.

### Multi-selection

- Shared properties render normally.
- Differing values render `Mixed` with `aria-valuetext="Mixed"` — not an empty value, which a screen
  reader reads as nothing.
- Editing applies to all selected nodes as **one transaction**, one undo step.
- Properties not present on every selected block are hidden, not disabled — a disabled control the
  user cannot understand is worse than an absent one.

### No selection

Show document settings: theme summary with a link to the Theme tab, canvas width, document name,
node count, and a "Version history" entry (stub until prompt 50). An empty inspector wastes the most
valuable panel in the app.

### Performance

- `ControlRenderer` is `memo`ised on `(path, value)`.
- The inspector subscribes to `selection.ids` and to each selected node — not to the document.
- Section collapse state persists per section id.
- Opening a colour control dynamically imports the picker.

## Verify

```bash
pnpm test
pnpm dev    # /studio
```

Tests:
- `control-renderer` exhaustive over all control kinds (`assertNever` proves it at compile time; add
  a runtime test that every kind renders)
- `useControlValue` resolves through the responsive cascade
- Multi-selection: shared → value, differing → `Mixed`, edit → one transaction
- Universal sections respect `capabilities`
- Every control in a rendered inspector has an accessible name (query by role and assert)

Manual, and report each with numbers:
- Select a heading → controls appear, grouped, matching its schema
- Drag the opacity scrub 200 px → **canvas render count 0** during the drag; **history length +1**
  after release. Report both numbers.
- Multi-select two headings with different text → `Mixed`; type a value → both change, one undo step
- `Cmd+Z` after the drag → returns to the pre-drag value in one step
- Tab through the whole inspector → every control reachable, labelled, in visual order
- Collapse a section, reload → still collapsed
- Select nothing → document settings, not an empty panel

## Done when

- [ ] Inspector fully generated from `controls`; no per-block inspector code exists
- [ ] `control-renderer` exhaustive with `assertNever`
- [ ] 200-px drag: zero canvas renders, one history entry — both measured and reported
- [ ] Props that cannot use CSS-variable preview documented, with the throttled path
- [ ] Universal sections gated by `capabilities`
- [ ] Multi-selection: `Mixed` with correct `aria-valuetext`, one transaction
- [ ] No-selection state shows document settings
- [ ] Full keyboard pass clean; every control labelled
- [ ] Colour picker dynamically imported
