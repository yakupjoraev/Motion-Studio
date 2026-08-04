# 50 — Persistence, import, templates

**Milestone** M11 · **Depends on** 49 · **Commit** `feat(web): add autosave, document management, and templates`

## Read first

- `docs/FILE_FORMAT.md` — § Import, § Autosave, § Templates
- `docs/STATE_MANAGEMENT.md` — § Persistence
- `docs/PRODUCT.md` — § 10. Persistence

## Goal

Nothing is ever lost. Autosave to IndexedDB, a document list, version history, `.motion` import with a
readable repair report, and eight starter templates.

The requirement behind all of it: **a crash, a refresh, or a bad file must never lose the user's
work.**

## Deliverables

```
apps/web/src/lib/storage/
├── idb.ts                    thin IndexedDB wrapper, ~40 lines, no dependency
├── document-store.ts         CRUD + the 10-snapshot ring buffer
├── document-index.ts         localStorage list of {id, name, updatedAt, nodeCount}
├── use-autosave.ts           debounce 2s + visibilitychange + beforeunload
├── use-document-list.ts
└── *.test.ts

apps/web/src/components/studio/documents/
├── file-menu.tsx             wire New/Open/Save/Save As/Recent/Version history
├── document-list-dialog.tsx  open, rename, duplicate, delete
├── import-dialog.tsx         file picker + drag-drop + paste
├── import-report.tsx         the repair/rejection report
├── version-history-dialog.tsx
├── template-picker.tsx       shown on New
└── *.test.tsx

apps/web/public/templates/
└── 8 .motion files
```

## Constraints

### The IndexedDB wrapper

~40 lines, hand-rolled, no dependency. One object store keyed by document id, one for snapshots.
Promise-wrapped, with a typed error on failure.

Do not add `idb` or `idb-keyval` for this — the used surface is `open`, `get`, `put`, `delete`, and
`getAllKeys`, and wrapping them is less code than the dependency justification.

### Autosave

```
change → dirty → debounce 2000ms → serialize → put
                ↘ visibilitychange (hidden) → flush now
                ↘ beforeunload → flush synchronously
```

`beforeunload` cannot await, so the synchronous flush writes to `localStorage` as a fallback lane and
the next load migrates it into IndexedDB. That is the only reliable pattern; note it in a comment.

**A failed write shows a persistent (non-auto-dismissing) toast with a "download document" action.**
Losing work silently is the one unacceptable failure mode, so this path is tested, not assumed:
simulate a quota error and assert the toast and the working download.

### Version history

Ring buffer of 10 snapshots per document. A snapshot is taken on autosave only when the document
changed materially (node count, or more than N patches since the last snapshot) — not every 2 seconds,
or the buffer covers 20 seconds of history and is useless.

`File → Version history` lists snapshots with timestamp and node count. Restore is a command, so it is
undoable.

### Import — the full pipeline

Every stage from `FILE_FORMAT.md` § Import, in order, with the documented error for each failure:

```
JSON.parse → size guard → migrate → schema → validate → repair-or-reject → validateProps → sanitize
```

Sources: file picker, drag-and-drop onto the canvas, and paste (`Cmd+V` with JSON on the clipboard when
nothing is selected).

### The import report

```
Imported "Landing page" with 3 repairs

  ⚠ 2 orphan blocks removed
  ⚠ 1 parent reference rebuilt from children
  ⓘ 1 block (custom-hero) is not available and renders as a placeholder

                                    [ Download original ]  [ Continue ]
```

- Every repair listed with a count and a plain explanation
- "Download original" preserves the unmodified file, so a repair can never destroy the user's only copy
- Rejections (cycle, missing root) show why and offer the download without importing
- Silent repair is worse than either extreme — this dialog is the requirement

### Templates

Eight `.motion` files: `saas-landing`, `portfolio`, `product-launch`, `docs-home`, `pricing-page`,
`blog-index`, `waitlist`, `changelog`.

- `meta.template: true`; loading clones with fresh ids so a template cannot be overwritten
- **Each is validated against the current schema in CI** (extend `check:registry`), so a template
  cannot rot as the schema evolves
- Each must look genuinely good — a template is a demo of the product's taste. Review each one the way
  you reviewed the hero defaults.
- Shown in a picker on `File → New`, with a thumbnail and a node count, plus a "Blank" option

### Document list

Open, rename, duplicate, delete (with an undo toast), sorted by `updatedAt`. Shows node count and a
thumbnail if one has been generated. Delete requires no confirmation dialog — the undo toast is
better UX and is the pattern used elsewhere in the app.

## Verify

```bash
pnpm test
pnpm test:e2e
pnpm dev
```

Tests:
- Autosave debounce; flush on `visibilitychange`; `beforeunload` writes the fallback lane
- The fallback lane migrates into IndexedDB on next load
- Quota error → persistent toast + working download (simulate the error)
- Snapshot ring buffer caps at 10, drops the oldest, and only snapshots on material change
- Restore is undoable
- Import: every failure stage produces its documented error
- Import: every repair case appears in the report with the right count
- Rejection cases offer download without importing
- Templates: all eight parse; loading clones with fresh ids (assert no shared id)
- Document list: CRUD, delete-with-undo

E2E `e2e/editor/persistence.spec.ts`:
1. Edit → wait 3 s → reload → changes present
2. Edit → reload immediately (before the debounce) → changes still present via the unload flush
3. Import a valid `.motion` → loads
4. Import a file with orphans → repair report with the right counts → continue → document usable
5. Import a file with a cycle → rejected with a reason, download offered
6. Import malformed JSON → readable error, existing document untouched
7. New from each of the 8 templates → each loads and is editable

Manual, and report:
- Edit for a minute, then kill the browser tab. Reopen. **Was anything lost?**
- Fill the IndexedDB quota (or simulate) → the toast appears and the download works
- Load each of the eight templates and look at it. Would you show it as a demo of this product? Fix
  what you would not.
- Version history: make five material changes, then restore an earlier snapshot, then undo the restore

## Done when

- [ ] IndexedDB wrapper hand-rolled, no new dependency
- [ ] Autosave with all three triggers; unload fallback lane and its migration tested
- [ ] Write failure → persistent toast with a working download, tested with a simulated quota error
- [ ] Snapshot ring buffer at 10, on material change only; restore undoable
- [ ] Full import pipeline with the documented error at every stage
- [ ] Import report lists every repair with counts and offers the original download
- [ ] Rejections explained, never silent
- [ ] Eight templates, CI-validated, each reviewed for quality
- [ ] Killing the tab mid-edit loses nothing — verified by hand
- [ ] All seven E2E persistence scenarios passing
- [ ] M11 complete
