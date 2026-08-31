---
group: Subsystems
order: 7
summary: `.motion` schema, versioning, migrations, import/export safety
---

# FILE_FORMAT

The `.motion` file is the document. It is plain JSON, validated by Zod, versioned, and
migratable. A document written by v1.0 must open in v1.9 — that promise is what makes the format
worth having.

## Structure

```jsonc
{
  "$schema": "https://motion-studio.dev/schema/v1.json",
  "version": 1,
  "meta": {
    "id": "doc_01HQZX8K2M",
    "name": "Landing page",
    "createdAt": "2026-03-14T10:22:00.000Z",
    "updatedAt": "2026-03-14T11:05:00.000Z",
    "generator": "motion-studio@1.0.0",
    "canvas": { "width": 1440, "background": "surface-0" }
  },
  "theme": { /* ThemeConfig — see THEME_ENGINE.md */ },
  "rootId": "node_root",
  "nodes": {
    "node_root": {
      "id": "node_root",
      "blockId": "container",
      "name": "Page",
      "parentId": null,
      "slot": "root",
      "children": ["node_nav", "node_hero"],
      "props": { "maxWidth": "full", "padding": 0 },
      "responsive": {},
      "motion": {},
      "effects": [],
      "locked": false,
      "hidden": false
    },
    "node_hero": {
      "id": "node_hero",
      "blockId": "hero-aurora",
      "name": "Hero",
      "parentId": "node_root",
      "slot": "children",
      "children": [],
      "props": {
        "title": "Design motion, ship code",
        "subtitle": "A visual editor for modern React interfaces.",
        "align": "center",
        "primaryCta": { "label": "Open studio", "href": "/studio" }
      },
      "responsive": { "md": { "align": "left" } },
      "motion": {
        "entrance": { "presetId": "fade-up", "channel": "entrance", "trigger": { "kind": "inView", "amount": 0.3, "once": true, "margin": "-10%" }, "params": { "distance": 32, "duration": 600 } }
      },
      "effects": [
        { "id": "fx_1", "effectId": "noise-overlay", "params": { "amount": 0.03 }, "layer": "front", "blendMode": "overlay", "opacity": 1 }
      ],
      "locked": false,
      "hidden": false
    }
  },
  "assets": {
    "asset_1": {
      "id": "asset_1",
      "kind": "image",
      "source": { "type": "url", "url": "https://images.example.com/hero.webp" },
      "width": 2400,
      "height": 1350,
      "alt": "Product screenshot",
      "blurDataUrl": "data:image/webp;base64,UklGR..."
    }
  }
}
```

## Schema

```ts
// packages/schema/src/document/document.schema.ts
export const nodeIdSchema = z.string().regex(/^node_[A-Za-z0-9_-]{1,32}$/).brand<'NodeId'>()

export const nodeSchema: z.ZodType<Node> = z.object({
  id: nodeIdSchema,
  blockId: blockIdSchema,
  name: z.string().min(1).max(80),
  parentId: nodeIdSchema.nullable(),
  slot: z.string().min(1).max(40),
  children: z.array(nodeIdSchema).max(500),
  props: z.record(z.unknown()),                  // per-block validation is a second pass
  responsive: z.record(breakpointIdSchema, z.record(z.unknown())).default({}),
  motion: z.record(motionChannelSchema, motionSpecSchema).default({}),
  effects: z.array(effectInstanceSchema).max(8).default([]),
  locked: z.boolean().default(false),
  hidden: z.boolean().default(false),
})

export const documentSchema = z.object({
  $schema: z.string().optional(),
  version: z.number().int().positive(),
  meta: documentMetaSchema,
  theme: themeConfigSchema,
  rootId: nodeIdSchema,
  nodes: z.record(nodeIdSchema, nodeSchema),
  assets: z.record(assetIdSchema, assetSchema).default({}),
})
```

`props` is `z.record(z.unknown())` at this level on purpose. Per-node prop validation needs the
registry, which the schema package must not depend on, so it happens in a second pass:

```ts
export function validateProps(doc: MotionDocument, registry: BlockRegistry): PropValidationReport
```

The two-pass design also means a document referencing an unknown block still parses — we can
report "3 blocks are from a newer version" instead of refusing the whole file.

## Ids

- `node_` + 22-char base58 (`nanoid`-style, hand-rolled ~20 lines in `utils`).
- `asset_`, `fx_`, `doc_` prefixed the same way.
- Ids are opaque. Nothing derives meaning from them, and nothing sorts by them.
- Ids are regenerated on paste and on duplicate, always. Two nodes with the same id is an
  unrecoverable state, so `validateDocument` treats duplicate keys as fatal.

## Versioning and migrations

`version` is the **schema** version, independent of the app version.

```ts
// packages/schema/src/migrations/index.ts
export const CURRENT_VERSION = 1

export interface Migration {
  readonly from: number
  readonly to: number
  readonly description: string
  migrate(doc: UnknownDocument): UnknownDocument
}

export const migrations: readonly Migration[] = [
  // { from: 1, to: 2, description: 'Move node.effects[].blend to blendMode', migrate: ... },
]
```

```ts
export function migrateDocument(input: unknown): Result<MotionDocument, MigrationError> {
  const versioned = versionProbeSchema.safeParse(input)
  if (!versioned.success) return err(new MigrationError('UNREADABLE', versioned.error))

  let doc = input as UnknownDocument
  let version = versioned.data.version

  if (version > CURRENT_VERSION) {
    return err(new MigrationError('FUTURE_VERSION', { found: version, supported: CURRENT_VERSION }))
  }

  while (version < CURRENT_VERSION) {
    const migration = migrations.find((m) => m.from === version)
    if (!migration) return err(new MigrationError('NO_PATH', { from: version }))
    doc = migration.migrate(doc)
    version = migration.to
  }

  const parsed = documentSchema.safeParse(doc)
  if (!parsed.success) return err(new MigrationError('INVALID_AFTER_MIGRATION', parsed.error))
  return ok(parsed.data)
}
```

### Migration rules

1. **Migrations are append-only.** Never edit a shipped migration — someone's file depends on
   exactly what it did.
2. **One version bump per structural change.** No batching.
3. **Every migration has a fixture pair** in `packages/schema/src/migrations/__fixtures__/`:
   `v{n}-input.json` and `v{n+1}-expected.json`, asserted byte-for-byte after normalization.
4. **Migrations are pure.** No registry, no clock, no randomness. An id generator, if needed, is
   injected.
5. **Additive changes do not need a migration.** A new optional field with a Zod `.default()`
   parses old documents fine. Bump the version only when the shape changes incompatibly.
6. **A chain test** loads the oldest fixture and migrates it all the way to `CURRENT_VERSION`,
   asserting validity at every step. That test is what makes the compatibility promise real.

## Import

```
File / paste
     │
     ▼
size guard ──────────► > 10 MB → "File too large"
     │
     ▼
JSON.parse ──────────► syntax error → "Not valid JSON (line 42)"
     │
     ▼
migrateDocument ─────► future version → "Made with a newer version"
     │                 no path        → "Cannot upgrade from version N"
     ▼
documentSchema.parse ► invalid → readable field-path report
     │
     ▼
validateDocument ────► invariant violation → repair or reject (see below)
     │
     ▼
validateProps ───────► unknown blocks / invalid props → per-node report, non-fatal
     │
     ▼
sanitizeAssets ──────► strip data: URLs above 2 MB, validate remote hosts
     │
     ▼
Loaded, with a warning summary if anything was repaired or dropped
```

The size guard runs on the **text**, before the parse. A parser is the one stage that cannot be
given a budget once it has started, so a file too large to accept must be refused before it is
handed to one — ADR-287.

### Repair vs reject

Some invariant violations are recoverable and repairing them is better than refusing the file:

| Problem | Action |
| --- | --- |
| Orphan node (unreachable from root) | Drop it, warn |
| `children` references a missing id | Remove the reference, warn |
| `parentId` disagrees with `children` | Trust `children`, rebuild `parentId`, warn |
| Duplicate id in `children` | Deduplicate, warn |
| Unknown `blockId` | Keep the node, render a placeholder, warn |
| Invalid props for a known block | Merge over defaults, keep valid keys, warn |
| Cycle | **Reject.** Cannot be repaired without guessing intent |
| Missing `rootId` | **Reject.** |

Every repair is listed in an import report dialog: what was wrong, what was done, and how many
nodes were affected. Silent repair is worse than either extreme.

### Security

A `.motion` file is untrusted input, and this is a client app, so the threat is XSS through
rendered content.

| Field | Handling |
| --- | --- |
| Text props | Rendered as text, never `innerHTML` |
| Rich text | Parsed to a restricted AST (bold/italic/link/code only); anything else dropped |
| URLs (`href`, `src`) | Scheme allowlist: `https:`, `http:`, `mailto:`, `/`, `#`. `javascript:` and `data:` rejected |
| Image `data:` URLs | Allowed up to 2 MB, MIME allowlist `image/png|jpeg|webp|avif|gif` |
| CSS escape-hatch props | Parsed and re-serialised by `validateCssDeclarations`; `expression()`, `@import`, `behavior`, `-moz-binding`, `element()` and every `url()` but an inline `data:image/*` that passes the asset sanitizer are rejected. Cap 8 kB |
| `blurDataUrl` | Must be `data:image/*;base64,`, max 4 kB |
| Block ids | Must match the registry or render a placeholder — never used to resolve a module path |
| Node names | Rendered as text; length-capped |

`sanitizeDocument(doc)` is a single pass returning `{ document, removed[] }` and is unit-tested
against a fixture of malicious payloads.

## Export

```ts
export function serializeDocument(doc: MotionDocument): string {
  return JSON.stringify(withStableKeyOrder(doc), null, 2)
}
```

- Stable key order (schema order, then alphabetical), 2-space indent, trailing newline. A
  re-saved document with no edits produces a **byte-identical file**, so `.motion` files diff
  cleanly in git. This is a small thing that makes the format feel professional.
- `updatedAt` is the only field that changes on save, and there is a `--no-timestamp` option in
  the export dialog for people who version-control their documents.
- `generator` records the app version, which is what makes bug reports actionable.

## Autosave

- Debounced 2 s after the last change; flushed on `visibilitychange` and `beforeunload`.
- Stored in IndexedDB, keyed by `meta.id`, with the last **10 snapshots** per document in a ring
  buffer.
- `File → Version history` lists snapshots by timestamp with a node count and a restore action.
  Restoring is a command, so it is undoable.
- A failed write shows a persistent (not auto-dismissing) toast with a download action. Losing
  work silently is the one unacceptable failure mode.

## Templates

Templates are `.motion` files with `meta.template: true`, shipped in
`apps/web/public/templates/`. Loading one clones it with fresh ids so a user cannot accidentally
overwrite a template.

v1 templates: `saas-landing`, `portfolio`, `product-launch`, `docs-home`, `pricing-page`,
`blog-index`, `waitlist`, `changelog`.

Each is validated in CI against the current schema — a template that stops parsing is a build
failure, which means templates cannot rot.

## Testing

- Round-trip: `parse(serialize(doc))` deep-equals `doc`, for 20 fixture documents.
- Byte-stability: serialising twice produces identical strings.
- Every invariant violation has a fixture and an assertion on the repair or rejection.
- Every sanitizer rule has a malicious fixture.
- Migration chain from the oldest fixture to current.
- Fuzz: 1000 randomly mutated valid documents — every one must either parse or fail with a typed
  error. Never a crash, never an unhandled exception.
