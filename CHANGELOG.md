# Changelog

Written by changesets — `docs/DEVOPS.md` § Releases. Every package moves together, so this file is
the product's history and the per-package files are its detail.

## 1.0.0 — not yet released

The first complete version: a visual editor that composes React interfaces on an infinite canvas and
exports source you own.

**The editor.** An infinite canvas with zoom, pan, snapping, alignment guides, rulers, marquee
selection and a multi-frame breakpoint preview. A document model with patch-based undo that coalesces
a slider drag into one step, a clipboard that survives a reload, and a layers tree that is operable
from the keyboard.

**The catalogue.** 72 blocks across nine categories, each typed by a Zod schema that also generates
its inspector, and each rendered in a catalogue page with the source it prints. 13 of them are effect
layers that mount behind a block rather than around it.

**Motion.** 51 presets over six channels — entrance, scroll, hover, cursor, continuous, exit — on one
easing and spring vocabulary, with `prefers-reduced-motion` honoured on every one of them.

**Export.** React, Next.js App Router, standalone HTML, the `.motion` document, and the theme as
tokens. The output imports nothing from this project, and the React and Next targets are checked by
`tsc` in a fixture project on every pull request — "compiles with zero edits" is a test rather than a
claim.

**The rest.** A token-driven theme engine with light and dark, a responsive engine with per-breakpoint
overrides, a playground of eight live CSS sandboxes, a documentation site built from `docs/`, and
error boundaries that always offer the document back.

**Quality gates in CI.** 8,235 unit tests, 408 end-to-end tests on three browsers, zero axe
violations, Lighthouse at or above 95 on four routes, a 250 KiB first-load budget for the studio, and
a visual regression suite of 208 screenshots.
