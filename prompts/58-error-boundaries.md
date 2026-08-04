# 58 — Error boundaries and recovery

**Milestone** M13 · **Depends on** 57 · **Commit** `feat(web): add error boundaries with document recovery`

## Read first

- `docs/ARCHITECTURE.md` — § Error boundaries
- `docs/CODE_STANDARDS.md` — § Errors
- `docs/FILE_FORMAT.md` — § Autosave
- `docs/UI_GUIDELINES.md` — § Copy

## Goal

Every failure mode has a designed response, and **every one of them offers a way to get the document
out.** The rule behind the whole prompt: a crash must never lose the user's work.

## Deliverables

```
apps/web/src/components/errors/
├── error-boundary.tsx           the base, with reset and reporting
├── node-error-card.tsx          per canvas node
├── canvas-error-panel.tsx       canvas root: reset viewport + download document
├── section-error-chip.tsx       per inspector section
├── dialog-error-state.tsx       export dialog fallback
├── download-document-button.tsx the escape hatch, used by all of them
└── *.test.tsx

apps/web/app/
├── error.tsx                    route-level
├── global-error.tsx             the last resort
└── not-found.tsx

apps/web/src/lib/errors/
├── error-context.ts             what was happening when it broke
├── format-error-report.ts       a copyable report for a bug filing
└── *.test.ts
```

## Constraints

### The five boundaries

| Boundary | Fallback | Escape hatch |
| --- | --- | --- |
| Canvas node | Inline card naming the block, rest of canvas alive | Select it / delete it / download document |
| Canvas root | Panel with the error summary | Reset viewport, download document, reload |
| Inspector section | Section collapses with an error chip | Other sections keep working; download document |
| Export dialog | Error with the IR warning list | "Copy JSON instead" |
| Route | `error.tsx` | Download the autosaved document, go to `/blocks` |

Every single one has a **download document** action, and every one of them is tested by deliberately
throwing and verifying the download produces a valid `.motion` file.

### The document is always retrievable

`download-document-button.tsx` reads from, in order:
1. The live store, if it is intact
2. The last IndexedDB autosave
3. The `beforeunload` localStorage fallback lane

So even if the store is the thing that broke, there is a path to the user's work. Test all three
branches by simulating each failure.

### Error copy

Per `UI_GUIDELINES.md` § Copy: state what happened, where, and what to do. Three clauses, one sentence.

```
✓ "Pricing table failed to render. Its `plans` value is invalid. Reset it or delete the block."
✗ "Oops! Something went wrong 😅"
✗ "Error: Cannot read properties of undefined (reading 'map')"
```

The raw error goes in a collapsible "details" section for the bug report, not in the primary message.

### Error report

`format-error-report.ts` produces a copyable block:

```
Motion Studio 1.0.0
Error: NODE_PROPS_INVALID
Block: pricing-table
Node: node_a3f2
Action: setProp plans[2].price
Browser: Chrome 121 / macOS 14.3
Document: 42 nodes, theme midnight

<stack trace>
```

No PII, no document content, nothing sent anywhere — it is a clipboard payload for a GitHub issue. Say
so in the UI ("Copy report — nothing is sent automatically"), because users are rightly suspicious of
error reporters.

`error-context.ts` tracks the last dispatched command and the last user gesture in a small ring buffer,
so the report says what was happening. That single field turns most unreproducible bug reports into
reproducible ones.

### `global-error.tsx`

The last resort: no layout, no providers, possibly no styles. Must be self-contained — inline styles
only, no imports beyond React. Its job is exactly two things: say what happened, and offer the
document download from localStorage.

Test it by throwing in the root layout.

### Recovery, not just reporting

Where a fix is possible, offer it:
- Invalid node props → "Reset to defaults" (a command, undoable)
- Corrupt viewport state → "Reset viewport"
- A block that consistently throws → "Replace with a placeholder" so the rest of the document is
  editable
- Failed autosave → "Retry" plus "Download"

An error state that only apologises is a dead end.

### Dev vs production

In development, errors also log to the console with the full context and **re-throw** after the boundary
renders, so the React error overlay still appears. In production, no console output beyond a single
`console.error` with the report.

## Verify

```bash
pnpm test
pnpm test:e2e
pnpm dev
```

Tests — each boundary gets a deliberate throw:
- Node boundary: a block throwing in render → card appears, siblings render, download works
- Canvas root: the canvas throwing → panel with reset and download
- Inspector section: a control throwing → chip appears, other sections functional
- Export dialog: codegen throwing → error state with "copy JSON"
- Route: a page throwing → `error.tsx` with the autosave download
- `global-error`: the root layout throwing → self-contained fallback with the localStorage download
- `download-document-button`: all three source branches, each producing a valid `.motion` file that
  re-imports cleanly
- `format-error-report`: contains the context fields, contains **no** document content
- Recovery actions: reset-props is undoable; replace-with-placeholder keeps the document editable

Manual, and report each:
- Throw in a block → is the message useful? Would a user know what to do?
- Kill the store (set it to `undefined` from the console) → can you still download your document?
- Throw in the root layout → does the global fallback appear, and does its download work?
- Copy an error report → read it. Is it enough to reproduce the issue? Does it leak anything?
- Corrupt the localStorage UI state → does the app start?
- Corrupt an autosaved document in IndexedDB → does the app start, and does it report the problem?

## Done when

- [ ] All five boundaries implemented with the documented fallbacks
- [ ] **Every boundary offers a document download**, and each was tested by a deliberate throw
- [ ] `download-document-button` works from all three sources, each producing a re-importable file
- [ ] Error copy follows the what/where/what-to-do rule; raw errors in a details section
- [ ] Error report includes the last command and gesture, and leaks no document content
- [ ] `global-error` is fully self-contained and its download works
- [ ] Recovery actions offered wherever a fix is possible
- [ ] Corrupt localStorage and corrupt IndexedDB both survivable — verified by hand
- [ ] M13 complete
