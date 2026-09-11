# Licences — the imported Uiverse catalogue

This package is not designed work. It is **a copy of somebody else's library**, imported whole so it
can be browsed, searched and ranked here, and every element in `data/` belongs to the person who
wrote it. That makes this file a different kind of record from `packages/blocks/LICENSES.md`: there
the question is "was a technique learned from a reference", here it is "may this code be copied, and
what has to travel with it".

## Uiverse

| Field | Verified |
| --- | --- |
| Verified on | 2026-09-11 |
| Source | `https://github.com/uiverse-io/galaxy` — the same catalogue the website publishes, as files |
| Terms | **MIT**, `Copyright (c) 2023 Uiverse.io`. The full text is in `LICENSE-uiverse.txt`, copied from the repository on the same day. |
| Additional clauses | **None.** No Commons Clause, no non-compete, no restriction on redistribution — checked in the licence text itself rather than in a summary. |
| Verdict | May be copied, modified and redistributed, including inside a proprietary product, provided the copyright notice and the licence text travel with it. |

That last condition is the one with teeth here, because Motion Studio's product **is** redistributed
source: a user exports a block and ships it into their own repository. So:

- `LICENSE-uiverse.txt` is committed beside the data and must stay there.
- Every record in `data/` keeps the element's `author`, and the upstream attribution comment is left
  inside the element's own markup rather than stripped from it.
- **Anything promoted out of this catalogue into `packages/blocks` carries the attribution into the
  code it generates.** A Motion Studio block derived from a Uiverse element is a copy of MIT source,
  not a technique learned from a reference, and the difference is exactly what the notice condition
  is about. A block built from *understanding* an element — rewritten against our schema, tokens,
  controls and reduced-motion policy — is the other case, and it records the technique the way
  `docs/DESIGN_REFERENCES.md` § Attribution describes.

## Why this catalogue may be here at all, when two others may not

`docs/DESIGN_REFERENCES.md` § What the check found (ADR-144) rules out Aceternity UI, whose terms
forbid redistributing its source "regardless of modifications", and React Bits, which is MIT **plus**
Commons Clause. Neither can live in a product that prints component source into other people's
projects. Uiverse is plain MIT with the standard notice condition, which that same reasoning permits.

## The elements themselves

3 802 elements by 927 authors across eleven categories, HTML and CSS only — **no scripts**, verified
at import time. Thirty-three reference an external image. Four hundred and thirty-three are Tailwind
elements whose styling is in their class names, which is why the record carries `styling` rather than
assuming a `<style>` block exists.
