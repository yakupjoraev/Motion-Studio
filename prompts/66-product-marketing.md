# 66 — Marketing the product

**Milestone** M15 · **Depends on** 65 · **Commit** `docs(marketing): write the positioning and the launch material`

## Read first

- `docs/VISION.md` — the positioning already exists in prose. This prompt turns it into a framework,
  it does not replace it.
- `docs/PRODUCT.md` — what the product actually does, which is where every proof point comes from
- `README.md` — the numbers, and they must not drift from it
- `docs/DESIGN_REFERENCES.md` — the visual bar any launch asset is held to

## Skills

Load them before writing, and say which one produced what:

- **`brand`** — voice, messaging framework, positioning. The structure below is its framework.
- **`design`** — any visual asset: social cards, the OG image, a launch banner.
- **`slides`** — the deck, if one is made.

## Goal

Motion Studio is finished and unexplained. `VISION.md` states the problem well and nothing turns that
into the sentences a launch needs: a positioning statement, three messages, the proof behind each, and
copy short enough to be read.

## The framework to fill

```
Mission              We [action] for [audience] by [method] so they can [outcome].
Vision               A world where [the change].
Value proposition    For [customer] who [problem], Motion Studio is a [category]
                     that [benefit]. Unlike [alternative], we [differentiator].
Positioning          Motion Studio is the [category] for [audience] who want [outcome]
                     because [reason to believe].
Primary message      One sentence.
Supporting messages  Three, each with the audience need it answers and the proof.
Elevator pitches     10 seconds, 30 seconds, 60 seconds.
```

### Where the differentiation actually is

`VISION.md` § The problem already names it, and it is unusually clean — do not soften it:

- **Design tools** give direct manipulation and hand back a picture or a hosted page.
- **Component libraries** give real code and hand back a static grid with one hard-coded demo.
- Motion Studio is the middle: direct manipulation over real components, with **code as the output
  format**.

### Proof points — from the product, and checked before use

Every number goes through `pnpm stats` rather than being remembered. The claims worth making:

| Claim | Where it is proved |
| --- | --- |
| The blocks are real React components, not pictures | The gallery renders the same component the export emits |
| Motion is tunable, not a fixed demo | 51 presets across six channels, plus a curve editor |
| The export compiles | The compile suite builds the emitted project and typechecks it |
| It is yours, offline, no account | Local-first persistence, MIT, no backend exists |
| It is responsive in a way you can see | The artboard is the band the block asks (ADR-356) |

**A claim without a proof point does not ship.** That is the same rule § 9 applies to engineering, and
marketing copy is where it is easiest to break.

## Voice

The repository already has a voice — the documents are direct, specific, and lead with the measurement.
Keep it. Three traits, with a do and a don't each, written down so the landing copy and the docs cannot
drift apart:

- **Specific, not grand.** "51 presets across six channels" beats "a rich motion system".
- **Honest about the edges.** The product says what it refuses to be; the marketing does the same.
- **Plain, not clever.** A sentence a developer can check beats a sentence they have to decode.

## Deliverables

```
docs/BRAND.md                 the filled framework: positioning, messages, proof, voice chart
apps/web/                     the landing copy, if the pass changes it — with a before/after
docs/assets/                  the OG image and social cards, if `design` produces them
```

Localised alongside prompt 65: this copy is one of the surfaces that has to exist in both languages.

## Verification

- [ ] Every number matches `pnpm stats` output on the day it was written
- [ ] Every claim maps to a row in the proof table, and the proof is real
- [ ] The 10-second pitch is read aloud and takes under 10 seconds
- [ ] The positioning statement names the alternative honestly — the component libraries are good, the
      gap is discovery, and copy that pretends otherwise is a claim a reader can disprove in a minute
- [ ] The landing copy and `docs/BRAND.md` say the same thing
