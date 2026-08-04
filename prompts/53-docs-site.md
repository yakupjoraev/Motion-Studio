# 53 — Documentation site

**Milestone** M12 · **Depends on** 52 · **Commit** `feat(web): render docs as a browsable site`

## Read first

- `docs/README.md` — the index and the reading paths
- `docs/PRODUCT.md` — § Surfaces
- `docs/ACCESSIBILITY.md` — § Landing, gallery, docs

## Goal

`/docs/[...slug]` renders `docs/*.md` as a real documentation site: sidebar, search, anchors,
next/previous, and a rendered architecture diagram.

The point is not that people will read it on the web. The point is that the documentation is a
first-class artifact — a reader who lands on the repo can browse the specification without cloning it,
and the docs stay honest because they are shipped.

## Deliverables

```
apps/web/
├── app/docs/
│   ├── layout.tsx                sidebar + content + toc
│   ├── page.tsx                  index, using the reading paths from docs/README.md
│   └── [...slug]/page.tsx        static, generateStaticParams over docs/
└── src/
    ├── lib/docs/
    │   ├── read-docs.ts          build-time: read docs/, parse frontmatter, extract headings
    │   ├── build-nav.ts          the section groups from docs/README.md
    │   ├── build-search-index.ts  headings + first paragraphs → a small JSON index
    │   └── *.test.ts
    └── components/docs/
        ├── docs-sidebar.tsx      grouped nav, current-page state, collapsible groups
        ├── docs-toc.tsx          on-page headings, scroll-spy
        ├── docs-search.tsx       ⌘K within docs, over the built index
        ├── docs-content.tsx      MDX components: headings with anchors, code, tables, callouts
        ├── docs-pager.tsx        previous / next in reading order
        ├── mermaid-diagram.tsx   or a hand-built SVG for the architecture diagram
        └── docs-breadcrumbs.tsx
```

## Constraints

### Static, at build time

`generateStaticParams` over the `docs/` directory. Markdown is read and compiled at build time — zero
runtime markdown parsing, zero client-side fetching of content. The whole route is static HTML.

Consequence: adding a doc file adds a page with no other change. Test that by adding a scratch file,
building, and confirming the route exists — then remove it.

### The nav comes from `docs/README.md`

Parse the index tables in `docs/README.md` to build the sidebar groups. Do **not** hand-maintain a
second navigation list — it would drift from the index within two commits.

If the parse is fragile, add a small frontmatter block to each doc (`group`, `order`) and derive from
that instead. Either way: one source, not two. State which you chose.

### Code blocks

- Shiki at build time, our theme
- Language label, copy button, optional filename
- Keyboard-scrollable: `tabindex="0"`, `role="region"`, labelled
- Line highlighting where the source markdown asks for it
- Horizontal overflow inside the block, never on the page

### The architecture diagram

`ARCHITECTURE.md`'s ASCII graph rendered as a real diagram. Two acceptable approaches:

1. Hand-built SVG with our tokens — full control, no dependency
2. A build-time Mermaid render to static SVG — less control, less work

Either way it must be: static SVG in the HTML (no client-side rendering), themed for both colour modes,
readable at 320 px (scrolling horizontally inside its own container), and accompanied by a text
alternative describing the structure for screen readers.

The ASCII version stays in the markdown as the source of truth, so someone reading the repo directly
still gets it.

### Search

- Build-time index: headings and first paragraphs, one JSON file, under 60 kB
- `⌘K` within docs, reusing the palette component from prompt 33 with a docs source
- Fuzzy match reusing `fuzzy-match.ts`
- Results show the doc name, the heading, and a snippet
- No search service, no runtime indexing

### Accessibility

- One `h1` per page, correct heading order, no skipped levels
- Anchor links on every heading, keyboard-focusable, with an accessible name ("Link to Snapping")
- Sidebar is a labelled `<nav>`; the current page has `aria-current="page"`
- TOC scroll-spy updates `aria-current` as you scroll
- Skip link to `#main` as the first focusable element
- Tables have proper headers with `scope`
- Callouts use a role and an icon, not colour alone

### Performance

Static content pages, so Lighthouse ≥ 95 × 4 should be straightforward. The things that break it:
the search index loading eagerly (lazy-load it on first `⌘K`), an unoptimised diagram, and web fonts
without `adjustFontFallback`.

## Verify

```bash
pnpm build
pnpm start
pnpm exec lighthouse http://localhost:3000/docs/architecture --form-factor=mobile
pnpm test
pnpm test:e2e:a11y
```

Report all four Lighthouse scores.

Tests:
- `read-docs` picks up every file in `docs/`
- `build-nav` produces the same groups as `docs/README.md`'s index (assert against the parsed tables)
- Heading extraction produces working anchor slugs, with collision handling
- Search index under 60 kB; queries return expected orderings
- Every internal doc link resolves to an existing page — **this is the important one.** Iterate every
  markdown link in `docs/` and assert the target exists. A broken cross-reference in the specification
  is a real defect, and there are hundreds of these links.

Manual, and report:
- Every doc page renders without a markdown artifact (stray `|`, broken table, unclosed code fence)
- The architecture diagram is readable in both colour modes and at 320 px
- `⌘K` search finds content across docs
- TOC scroll-spy tracks correctly
- Every anchor link works when pasted fresh
- Tab through a doc page: skip link, sidebar, content, TOC — logical order
- With a screen reader: report what the architecture diagram announces
- Search index loads only on first `⌘K` (check the Network panel)

## Done when

- [ ] All 26 doc files render as static pages
- [ ] Nav derived from a single source; approach stated
- [ ] **Every internal doc link verified to resolve** — count reported
- [ ] Architecture diagram as static themed SVG with a text alternative
- [ ] Build-time search index under 60 kB, lazy-loaded, reusing the palette and fuzzy matcher
- [ ] Correct heading structure, anchors, landmarks, `aria-current`, skip link
- [ ] Lighthouse ≥ 95 × 4; scores reported
- [ ] Adding a doc file adds a page with no other change — verified
- [ ] M12 complete
