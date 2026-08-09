# Licences — design references

`docs/DESIGN_REFERENCES.md` § The licence check requires this file: every reference this package's
blocks were designed against, the licence as **verified in the session that used it**, and the date
of that verification.

The distinction the document draws matters here and is worth restating: a CSS technique is not
copyrightable, a specific implementation is. Nothing in this package was adapted from source. Every
entry below records a reference that was *looked at and understood*, and the block that came out of
it names the technique in its own doc comment.

## impeccable.style

| Field | Verified |
| --- | --- |
| Verified on | 2026-08-09 |
| Site terms | **No licence is stated on the site.** The footer links a privacy page; there is no terms or licence page. |
| Repository behind it | `https://github.com/pbakaus/impeccable` — **Apache-2.0**, stated in the repository sidebar and in the README's License section. |
| What was taken | Technique only. No source, no markup, no class strings, no gradient values. |
| Used by | `hero/hero-centered`, `hero/hero-split`, `hero/hero-aurora`, `hero/hero-video`, `hero/hero-terminal`, `hero/hero-app-preview` |

The site's own terms being absent is the case the document's third bullet covers: *"If it is unclear,
absent, or restrictive: do not adapt the code."* That is the route taken regardless of the
repository's Apache-2.0 grant — the blocks were built from an understanding of how the effects work,
against our own schema, tokens, reduced-motion policy and cost classes, and each one says so where it
is implemented.

The techniques learned and rebuilt, in the words of the blocks that carry them:

- **Aurora** — several blurred radial fields on separate layers, each on its own period so their
  interference never visibly repeats, with a scrim for text contrast and a noise overlay to hide
  gradient banding. Our version is parameterised through Zod, tunable in the inspector, correct in
  light mode as well as dark, and stops rather than slows under reduced motion.
- **The centred marketing hero** — one wide accent field behind the headline and nothing else, so the
  light reads as depth rather than as decoration.
- **The full-bleed media hero** — a gradient scrim rather than a flat overlay, heaviest where the
  type sits.
- **The tilted product shot** — perspective on the rotating element's own transform rather than on a
  parent, with the accent glow behind the plate rather than behind the section.
- **The developer-tool hero** — window hierarchy from two surfaces and one hairline, no gradient.

## shadcn/ui

Vendored under its own rules in `packages/ui/LICENSES.md`. No block in this package derives from it.
