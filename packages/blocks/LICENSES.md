# Licences — design references

`docs/DESIGN_REFERENCES.md` § The licence check requires this file: every reference this package's
blocks were designed against, the licence as **verified in the session that used it**, and the date
of that verification.

The distinction the document draws matters here and is worth restating: a CSS technique is not
copyrightable, a specific implementation is. **Nothing in this package was adapted from source.**
Every entry below records a reference that was looked at and understood, and the block that came out
of it names the technique in its own doc comment.

One project-specific rule decides the entries that follow, and it is stricter than the licences are
(ADR-144): Motion Studio's product *is* redistributed component source — a user exports a block and
ships it — so a licence that permits use but forbids redistributing the component forbids adaptation
here.

## impeccable.style

| Field | Verified |
| --- | --- |
| Verified on | 2026-08-16 (re-verified; first checked 2026-08-09) |
| What it actually is | A design-vocabulary plugin for coding agents: one `/impeccable` command with 23 subcommands, `DESIGN.md` / `PRODUCT.md` context files, 59 anti-pattern detectors, and a standalone CLI. **Not a component or effect library.** |
| Site terms | **No licence or terms page.** The footer offers changelog, faq and privacy only. |
| Repository behind it | `https://github.com/pbakaus/impeccable` — **Apache-2.0**, stated in the repository metadata and in the README's License section. |
| What was taken | Nothing but a standard of finish. No source, no markup, no class strings, no gradient values — there is no effect implementation on the site to take. |
| Used by | The whole product as a quality bar; no block derives from it. |

The 2026-08-16 check corrected an assumption this file previously carried. The earlier entry credited
the site with an *aurora treatment*, a *full-bleed media hero* and a *developer-tool hero* as
techniques studied there. The site carries none of those as implementations: it is a dark textured
surface with a single gold accent and monospace annotation labels. What the hero blocks of prompt 25
actually did — build each treatment from an understanding of how it works, against our schema, tokens,
reduced-motion policy and cost classes — is unaffected and is what their doc comments claim. The
attribution was too specific, and this is the corrected version of it.

## Aceternity UI

| Field | Verified |
| --- | --- |
| Verified on | 2026-08-16 |
| Terms | `https://ui.aceternity.com/licence` — proprietary. Permits building unlimited end products, including commercial ones. **Forbids** redistributing an item "as a stock image or its source files, regardless of modifications", and forbids selling or distributing items or derivative works on any marketplace. |
| Verdict | **Restrictive for this project.** Our export engine hands a user component source, which is the redistribution the terms exclude. Not adapted. |
| Used by | Nothing. |

## Magic UI

| Field | Verified |
| --- | --- |
| Verified on | 2026-08-16 |
| Terms | `https://github.com/magicuidesign/magicui` — **MIT**. |
| Verdict | Permissive, and adaptation would have been legal with the notice preserved. Not adapted all the same: the effects in this package are built from technique (ADR-144), and copying from one reference while refusing the others would put two different rules in one directory. |
| Used by | Nothing. |

## React Bits

| Field | Verified |
| --- | --- |
| Verified on | 2026-08-16 |
| Terms | `https://github.com/DavidHDev/react-bits` — **MIT + Commons Clause License Condition v1.0**. Use, including commercial use, is granted; the components may not be sold, sublicensed or redistributed "alone, in a bundle, or as a ported version". |
| Verdict | **Restrictive for this project**, for the same reason as Aceternity: a ported component leaving in an export is exactly the excluded case. Not adapted. |
| Used by | Nothing. |

## shadcn/ui

| Field | Verified |
| --- | --- |
| Verified on | 2026-08-16 |
| Terms | `https://github.com/shadcn-ui/ui` — **MIT**, distributed as copy-into-your-project source. |
| Verdict | Vendored under its own rules in `packages/ui/LICENSES.md`. No block in this package derives from it. |

## The effects catalogue

The thirteen effects in `src/effects/` are CSS techniques with no single owner — a blurred radial
field, a repeating conic sweep behind a mask, a tiled `radial-gradient` dot lattice, an SVG feTurbulence
grain, a `mix-blend-mode: overlay` scanline stack. Each block's doc comment states the technique in a
paragraph, so the next person can change it rather than being afraid of it, and states that it was
built from technique rather than from source.

The two heavy ones — `mesh-gradient` and `particles` — are lazy-loaded and declare `costClass: 'heavy'`;
the other eleven are CSS-only and export as CSS.
