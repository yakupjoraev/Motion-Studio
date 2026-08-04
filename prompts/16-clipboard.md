# 16 — Clipboard

**Milestone** M2 · **Depends on** 15 · **Commit** `feat(editor): add clipboard with cross-tab support`

## Read first

- `docs/EDITOR_ENGINE.md` — § Clipboard
- `docs/FILE_FORMAT.md` — § Security (paste is untrusted input)
- `docs/SHORTCUTS.md` — § Editing

## Goal

Copy, cut, paste, paste-in-place, and paste-style — working across browser tabs, remapping ids
correctly, and rejecting unknown blocks gracefully rather than failing the whole paste.

## Deliverables

```
packages/editor/src/clipboard/
├── clipboard.types.ts       SerializedSubtree
├── serialize-subtree.ts     selection → SerializedSubtree with assets
├── deserialize-subtree.ts   validate + remap ids + report rejections
├── system-clipboard.ts      read/write with the marker, feature-detected
├── paste-target.ts          where a paste lands
├── style-props.ts           which props count as "style" for paste-style
└── *.test.ts
```

Then replace the stub `clipboard-slice.ts` from prompt 13.

## Constraints

### Serialization

`serializeSubtree` takes the **normalized** selection (parents only, no descendants of selected
nodes — `normalizeSelection` already did that) and includes every descendant plus every referenced
asset. Also includes `theme.palette` so a cross-document paste can resolve token references
sensibly.

### System clipboard

```ts
const MARKER = '/* motion-studio:v1 */'
```

Written as `text/plain` with the marker prefix, so:
- Paste into our app is recognised by the marker
- Paste into a code editor yields readable JSON, which is a nice property and costs nothing

Feature-detect `navigator.clipboard.writeText`. If unavailable or permission-denied, fall back to
the in-store clipboard silently — this is a case where a silent fallback is correct, because the
user's action still works.

### Deserialization is untrusted input

A pasted payload may come from another tab, another version, or a text editor. So:

1. Parse JSON; failure → the paste is treated as plain text (or ignored if no text target).
2. Validate against the subtree schema; failure → reject with a readable message.
3. `sanitizeDocument` rules apply to the pasted nodes.
4. **Per-node rejection for unknown `blockId`.** A partial paste with a report beats a failed paste.
   Report: "Pasted 4 of 6 blocks. 2 blocks (`custom-hero`) are not available."
5. Remap **every** id: nodes, effects, assets, and internal references. Test that no id from the
   source appears in the result.

### Paste target

```
1. If a container is isolated → into it, at the end
2. Else if there is a selection → into the selection's parent, at (selection index + 1)
3. Else → into root, at the end
```

`pasteInPlace` uses the source's original parent and index when that parent still exists, falling
back to the normal resolution otherwise.

### Paste style

`style-props.ts` defines which prop categories are "style". Derive it from the control group ids in
each block's `controls` (`style`, `effects`, `typography`), not from a hard-coded list — otherwise
adding a style prop to a block silently excludes it from paste-style.

Paste-style onto multiple nodes is one transaction, and only applies props the target block's schema
accepts. Props the target does not have are skipped, silently — that is expected, not an error.

### One transaction

Every paste is a single transaction, so it is one undo step regardless of node count. Test with a
five-node paste.

## Verify

```bash
pnpm --filter @motion-studio/editor test --coverage
```

Required assertions:
- Round-trip: `deserialize(serialize(selection))` produces an equivalent subtree with all-new ids
- No source id appears in the pasted result (assert over the full id set)
- Internal references remapped: a node referencing an asset still references it, by the new id
- Paste of 5 nodes → 1 history entry
- Unknown `blockId` → partial paste with the count and the block id in the report
- Malformed JSON → typed error, no crash, document unchanged
- Malicious payload (a `javascript:` href in a pasted node) → sanitised, reported
- Paste target: all three resolution branches
- `pasteInPlace` with a deleted original parent → falls back correctly
- Paste-style: only style props applied; content untouched; unsupported props skipped
- Clipboard write failure → falls back to the store, paste still works

Manual check in a browser (jsdom cannot test this properly): copy in one tab, paste in another.
Report whether it worked.

## Done when

- [ ] Serialize/deserialize round-trips with full id remapping
- [ ] No source id survives a paste, proven over the whole id set
- [ ] Cross-tab paste works in a real browser
- [ ] Unknown blocks produce a partial paste with a readable report
- [ ] Malformed and malicious payloads handled without crashing
- [ ] Paste is one history entry
- [ ] Paste-style derives its prop set from control groups, not a hard-coded list
- [ ] Clipboard-permission failure degrades silently to the store
- [ ] Coverage floors met; `packages/editor` complete for M2
