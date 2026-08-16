# DESIGN_REFERENCES

Motion Studio's visual bar is set by looking at the best work in the field. This document says
which references are used, how they are used, and — importantly — where the line is between
*learning a technique* and *taking someone's code*.

This matters more here than in most projects. The repository is public, MIT-licensed, and its whole
premise is that the code is trustworthy. A licence violation buried in an effect block would
undermine that completely.

## The references

| Reference | What we take from it | Role |
| --- | --- | --- |
| [impeccable.style](https://impeccable.style) | The level of finish: surface treatment, depth, typographic scale, restraint, motion character. **Not** an effect library — see the note below | **Primary reference for the entire product** |
| [Aceternity UI](https://ui.aceternity.com) | Scroll-driven composition ideas, card treatments | Secondary |
| [Magic UI](https://magicui.design) | Micro-interaction vocabulary, marquee and dock patterns | Secondary |
| [React Bits](https://reactbits.dev) | Text animation techniques | Secondary |
| [shadcn/ui](https://ui.shadcn.com) | Chrome primitives | **Vendored** — see below, different rules |
| Linear, Vercel, Framer (product UIs) | Density and restraint in tool chrome specifically | Chrome ergonomics reference |

**impeccable.style is the primary reference for the whole product, not just the effects
category.** Every visual surface is measured against it: the landing page, the block gallery, the
docs site, every block in the registry, and the studio's own chrome. When a surface looks merely
competent, it is not finished.

The next section says what that means per surface, because "apply it everywhere" means something
different in a marketing hero than in a 28-pixel inspector row.

## Applying it per surface

The reference applies everywhere. What changes is **loudness**, not standard of finish.

| Surface | How impeccable applies | Loudness |
| --- | --- | --- |
| Landing page | Fully. Aurora, mesh gradients, glass, spotlight, scroll choreography, text reveals. This page should be indistinguishable in quality from the reference. | **Maximum** |
| Block gallery | Fully on the previews; restrained on the surrounding chrome so the blocks are the subject | High on content |
| Docs site | Typographic treatment, surface depth, code-block finish, subtle gradient accents | Medium |
| Blocks in the registry | Fully. Every hero, card, pricing table and CTA is held to the reference's standard — this is the product's actual output | **Maximum** |
| Effects category | Fully. This category *is* the reference's vocabulary, implemented properly | **Maximum** |
| Studio chrome | Craft level: surface precision, micro-interaction quality, glass on floating panels, hairline treatment, motion timing. **Not** visual loudness. | **Low, high craft** |

### Why the chrome is the exception

The studio's chrome is a professional instrument sitting behind the user's work. If the panels carry
animated gradients, the canvas stops being the only colourful thing on screen — and the user can no
longer tell their design from our UI. That is a functional defect in an editor, not a matter of
taste. [UI_GUIDELINES.md](UI_GUIDELINES.md) § Character owns that rule and it stands.

So the chrome takes from impeccable the things that read as quality without competing:

- **Surface treatment** — the exact value relationships between stacked surfaces, hairline borders
  that catch light, the inner top highlight on dark elevated surfaces
- **Micro-interaction craft** — how a press feels, how a popover enters, how a value snaps
- **Glass, where it earns its place** — floating panels, the command palette, overlays over the
  canvas. Not on static panels.
- **Motion timing** — the specific easing character, not longer or louder animation
- **Typographic precision** — optical alignment, tracking at small sizes, tabular numerals in value
  fields

What it does not take: animated gradients in panels, decorative glow, aurora backgrounds, cursor
effects in chrome, anything above the 4-simultaneous-glass cap.

The test: screenshot the studio with a document open. **The user's design should be the only thing
your eye goes to.** If the chrome pulls attention, it is too loud regardless of how good it looks in
isolation.

## Two different relationships

Do not confuse them. They have different rules.

### Vendored (shadcn/ui only)

shadcn/ui is MIT-licensed and **explicitly designed to be copied into your project** — that is its
distribution model, not a loophole. So: copy the component into `packages/ui`, adapt it to our
tokens and density, keep the MIT notice in `packages/ui/LICENSES.md`.

This applies to shadcn/ui and to anything else that is MIT *and* distributed as
copy-into-your-project source. Nothing else.

### Referenced (everything else)

For every other reference the workflow is: **look, understand, then build.**

```
1. Study the effect in a browser. Open devtools. Understand the technique:
   which properties, which layers, which timing, which trick makes it read well.

2. Write down the technique in one paragraph, in the block's doc comment.

3. Implement it from that understanding, against:
      - our Zod schema and control descriptors
      - our design tokens
      - our motion preset model (never a hard-coded animation)
      - our reduced-motion policy
      - our cost-class and scheduler caps

4. Compare the result side by side with the reference. Iterate on quality, not on similarity.
```

Step 3 is not a formality that produces the same file with different variable names. Our
constraints genuinely change the implementation: the effect must be parameterised through a schema,
must degrade under reduced motion, must respect the `gpuHeavy` cap, and must emit correct source
through codegen. A reference implementation does none of those things.

## The licence check — required before adapting

Before adapting anything from a reference, in the session that does it:

- [ ] Find the licence. Check the repository, the site footer, and any terms page.
- [ ] If it is a permissive OSS licence (MIT / ISC / BSD / Apache-2.0): note it in
      `packages/blocks/LICENSES.md` with the source URL and the licence text or a link to it.
- [ ] If it is **unclear, absent, or restrictive**: do not adapt the code. Implement the technique
      from your own understanding of how the effect works — CSS techniques are not copyrightable,
      specific source code is. State in the block's doc comment that it was built from technique,
      not source.
- [ ] If the reference is a paid or licensed product, and you are a customer: check whether the
      licence permits redistribution in an open-source project. Assume it does not until you have
      read that it does.
- [ ] When in doubt, do not copy. The technique is the valuable part and it is freely learnable.

**A note on impeccable.style specifically:** verify its current terms yourself in the session that
first adapts from it, and record what you found in `packages/blocks/LICENSES.md`. Do not rely on
this document's summary or on any assumption about it — terms change, and this file was written
before that check happened.

### What the check found (2026-08-16, ADR-144)

It found something this document had assumed away. impeccable.style is **a design-vocabulary plugin
for coding agents** — one command with 23 subcommands, context files, and 59 anti-pattern detectors,
under Apache-2.0 as `pbakaus/impeccable`. Its own page is a dark textured surface with a single gold
accent and monospace annotation labels: a visual language held to a very high standard, and worth
measuring our surfaces against. It is **not** a catalogue of aurora, mesh, beam or spotlight
implementations, and there is no such implementation on it to open in devtools and study.

Two consequences, both permanent:

1. **The effects category has no side-by-side.** Its bar is held by § What we are aiming for below —
   eight requirements, each checkable — and by contrast measurement over real text in both colour
   modes. An argued verdict against stated criteria, never "it looks close to the reference".
2. **The other three references are read-only for us.** Aceternity's terms forbid redistributing
   source "regardless of modifications"; React Bits is MIT **plus Commons Clause**, which forbids
   redistributing the components in a bundle or as a port. Motion Studio's product is redistributed
   component source — a user exports a block and ships it — so neither may be adapted here even
   though both may be freely *used* in an ordinary app. Magic UI is plain MIT; shadcn/ui is MIT and
   distributed to be copied, which is why it alone is vendored.

## Attribution

Every block or preset whose *design* came from a reference carries a doc comment:

```ts
/**
 * Aurora background.
 *
 * Technique: three blurred radial gradients on separate layers, each drifting on its own
 * `background-position` cycle at slightly different periods so the interference pattern never
 * visibly repeats. A noise overlay at `mix-blend-mode: overlay` hides gradient banding.
 *
 * Built from technique, not from source: no reference implementation was adapted (ADR-144).
 * Implemented independently against our schema, tokens, and reduced-motion policy.
 * See docs/DESIGN_REFERENCES.md.
 */
```

Three things that comment does:
1. Explains the technique, so the next person can modify it rather than being afraid of it.
2. Credits the design influence honestly.
3. Makes the relationship explicit, so nobody later assumes it was pasted.

Plus a single `packages/blocks/LICENSES.md` listing every reference, its licence as verified, and
the date of verification. And a `## Design references` section in the root `README.md` — crediting
influences openly reads as confidence, not weakness.

## What we are aiming for, concretely

The reference sets the bar; our constraints raise it. For every effect in the catalogue, ours must
additionally be:

| Requirement | Why the reference version usually is not |
| --- | --- |
| Parameterised through a Zod schema | Reference implementations are one fixed demo |
| Tunable live in the inspector | Needs control descriptors that generate UI |
| Correct under reduced motion | Most effect libraries ignore this entirely |
| Within the scheduler's `gpuHeavy` cap | No shared observer or frame loop in a standalone demo |
| Exportable as readable source | Codegen fragment, hoisted constants, honest CSS |
| Contrast-checked against the theme | Effects that break text legibility on some palettes |
| Correct in light *and* dark | Most are dark-only |
| Accessible: `aria-hidden`, no flashing above 3 Hz | Rarely considered |

If our version is only as good as the reference, we have not finished. The differentiator of this
project is not having the effects — it is having them be **manipulable, accessible, and
exportable**, which is exactly the gap named in [VISION.md](VISION.md).

## When a reference cannot be matched

Sometimes an effect depends on WebGL, a paid asset, or a technique that fails our performance or
accessibility budget. Then:

1. Say so, in the block's doc comment or in `ROADMAP.md`.
2. Ship the closest version that meets the budgets.
3. Do not ship an effect that breaks reduced motion or the frame budget in order to look closer to
   a reference.

The budgets win. An effect that drops frames in a tool about motion is worse than a simpler effect
that does not.
