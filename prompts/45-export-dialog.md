# 45 — Export dialog

**Milestone** M9 · **Depends on** 44 · **Commit** `feat(web): add export dialog with streaming generation`

## Read first

- `docs/EXPORT_ENGINE.md` — § Options, § Export dialog, § Warnings
- `docs/PRODUCT.md` — § 7. Export
- `docs/PERFORMANCE.md` — § Mandatory dynamic imports
- `docs/UI_GUIDELINES.md` — § Loading and empty states

## Goal

The export UI: opens instantly, streams generated files in, shows warnings before code, and offers
copy, download, and zip. Plus **Copy React** on a selection, which shares the exact same pipeline.

## Deliverables

```
apps/web/src/components/studio/export/
├── export-dialog.tsx           the dialog shell
├── target-selector.tsx         five targets
├── options-panel.tsx           the ExportOptions controls
├── warnings-list.tsx           grouped, with doc links
├── file-tree.tsx               virtualized, sizes, per-file copy
├── code-viewer.tsx             syntax-highlighted, keyboard-scrollable
├── download-actions.tsx        copy all, download, zip
├── use-export.ts               lazy-loads codegen, memoises on an option hash
├── use-copy-selection.ts       Copy React from the context menu / Mod+Shift+C
└── *.test.tsx
```

## Constraints

### Opens instantly

The dialog appears in the frame the button is pressed. Generation happens after, streaming results in
with per-file skeletons at the correct size. **Never** await generation before showing the dialog —
that is the difference between a tool that feels fast and one that feels like a build step.

```ts
// codegen is ~45 kB and prettier ~180 kB — both load on demand
const { buildIR, printers } = await import('@motion-studio/codegen')
```

Verify with the build output that neither appears in the studio's initial chunk.

### Memoisation

`use-export` memoises on `hash(options) + document.version`. Toggling "include theme" regenerates only
what changed — in practice, re-running `buildIR` is cheap and only the printers need rerunning, so
cache the IR separately from the printed files. Report the measured regeneration time for an option
toggle on the full-landing fixture.

### Generation off the main thread — decided by measurement

This is a measurement decision, and the threshold is set **before** you measure:

```
Measure buildIR + print + format on the 60-node fixture, median of 9 runs.
  < 100 ms  → main thread, wrapped in startTransition
  ≥ 100 ms  → Web Worker
```

100 ms is the point at which a user perceives the dialog as blocked rather than working.

**Write the result as an ADR in `docs/DECISIONS.md` before implementing** — the question, the
threshold above, the measured numbers, the decision, and the consequences you are accepting. The
template in that file is exactly this case.

Do not add a worker speculatively, and do not skip the measurement and keep it on the main thread
because that is less work. Both are the banned fourth way from
`docs/ENGINEERING_CONTRACT.md` § 9.

### Warnings before code

Warnings are shown **above** the code, grouped by category, with counts and doc links. A collapsed
state is fine when there are none. They never block export.

A missing-`alt` warning links to the offending node with a "select it" action that closes the dialog
and selects the node. That closes the loop instead of just complaining.

### File tree

Virtualized (an export can be 20+ files), with sizes, per-file copy buttons, and a total. Clicking a
file shows it in the viewer. The tree is a `role="tree"` with the same ARIA discipline as the layers
tree.

### Code viewer

- Syntax highlighting via a **dynamically imported** lightweight highlighter (`prism`-lite or
  `shiki`'s web bundle with only the needed languages). Not the full Shiki bundle.
- `tabindex="0"` + `role="region"` + label so it is keyboard-scrollable
- Copy button with the 1.2 s checkmark
- Line numbers, soft wrap toggle
- Large files (> 2000 lines) render virtualized or truncate with a "download to see all" note — never
  freeze the dialog

### Copy React on a selection

```ts
exportDocument(document, { ...defaults, scope: 'selection', selectionIds: selection.ids })
```

**The same pipeline**, with `scope: 'selection'`. One code path means the context-menu button cannot
drift from the dialog. Available from the context menu and `Mod+Shift+C`, with a toast confirming
("Copied HeroSection.tsx").

### Zip

`jszip`, dynamically imported only when the zip button is pressed. Filename from the document name,
kebab-cased, with a date suffix.

## Verify

```bash
pnpm test
pnpm test:e2e
pnpm build          # confirm codegen and prettier are NOT in the studio chunk
pnpm dev
```

Tests:
- Dialog renders before generation completes (assert the skeleton state exists)
- `use-export` memoises: same options → no regeneration
- Option change regenerates; IR cached separately from printed output
- Warnings grouped with counts; the "select node" action dispatches a selection
- `scope: 'selection'` produces just that subtree
- File tree ARIA; code viewer is a labelled keyboard-scrollable region
- Large-file path does not block

E2E `e2e/export/*.spec.ts`:
1. Export React → dialog opens, files stream in, copy puts the expected first line on the clipboard
2. Export Next → the expected file list
3. Export HTML → one file
4. Export JSON → re-importing it produces an identical document
5. Copy React on a selection → clipboard contains only that component
6. Zip download → the archive contains the expected entries

Manual, and report with numbers:
- Time from clicking Export to the dialog being visible — should be under one frame
- Time until the first file appears
- Time to regenerate after toggling an option
- `buildIR` + print + format time on the 60-node fixture, and your worker decision
- Confirm from the build output that `codegen`, `prettier`, `jszip`, and the highlighter are all in
  separate chunks — list the chunk names and sizes
- Keyboard-only: open the dialog, change options, navigate files, copy, close, focus restored

## Done when

- [ ] Dialog visible within one frame of the click; generation streams in
- [ ] `codegen`, `prettier`, `jszip`, highlighter all dynamically imported and absent from the studio
      chunk — verified in the build output and reported
- [ ] Generation time measured; worker decision made on evidence and reported
- [ ] Warnings above code, grouped, with a working "select node" action
- [ ] File tree virtualized with correct ARIA; code viewer keyboard-scrollable
- [ ] Copy React on a selection uses the same pipeline as the dialog
- [ ] All six E2E export specs passing on three browsers
- [ ] Full keyboard pass with focus restore
