# EXPORT_ENGINE

Export is where the project either earns credibility or loses it. Generated code is read by
engineers, so it must look like an engineer wrote it: correct imports, real types, no dead props,
no wrapper soup, formatted, and it must compile with zero edits.

## Pipeline

```
MotionDocument + ExportOptions
        │
        ▼
  buildIR({ document, registry, presets, options })   ← all the thinking happens here
        │
        ▼
     CodegenIR
        │
   ┌────┼────────┬──────────┬──────────┐
   ▼    ▼        ▼          ▼          ▼
 react  next    html      json     tokens
        │
        ▼
  format(files)     Prettier standalone, lazily imported
        │
        ▼
  ExportResult { files, warnings, dependencies }
```

The IR exists so printers are dumb. Naming, hoisting, dedupe, import collection, and class
generation are decided **once**. A printer only serialises. Adding a fifth target means writing a
printer, not re-solving the hard problems.

That rule is what puts three registry-backed facts in the IR rather than in a printer: the client
boundary, the runtime modules a block asks the export to write beside it, and the structured data a
block emits when a prop turns it on. All three need the registry, and two of them dedupe across the
whole document, so a printer holding them would be a second decision site — ADR-227. The preset
catalogue arrives as an argument for the reason ADR-226 records: importing it would put React in the
export engine's runtime graph.

## The IR

```ts
// packages/codegen/src/ir/ir.types.ts
export interface CodegenIR {
  readonly components: readonly IRComponent[]
  readonly entry: ComponentName
  readonly theme: IRTheme
  readonly assets: readonly IRAsset[]
  readonly stylesheet: IRStylesheet         // rules and keyframes passes 3 and 4 produced
  readonly modules: readonly IRModule[]     // `runtimeModule`s, deduped by path — ADR-201
  readonly dependencies: Readonly<Record<string, string>>   // name → semver range
  readonly warnings: readonly IRWarning[]
}

export interface IRComponent {
  readonly name: ComponentName            // 'HeroSection'
  readonly fileName: string               // 'hero-section.tsx'
  readonly props: readonly IRProp[]       // extracted props, if parameterised
  readonly imports: readonly ImportSpec[]
  readonly hoisted: readonly HoistedConst[]  // variants, transitions, data arrays
  readonly hooks: readonly string[]
  readonly client: IRClient               // whether `'use client'` is printed, and why
  readonly root: IRElement
  readonly usedClasses: readonly string[]
}

export interface IRElement {
  readonly tag: string                    // 'div' | 'section' | 'motion.div' | 'HeroSection'
  readonly classNames: readonly string[]  // already breakpoint-ordered
  readonly attributes: Readonly<Record<string, IRValue>>
  readonly children: readonly (IRElement | IRText | IRExpression)[]
  readonly cssVars?: Readonly<Record<string, string>>
  readonly notes?: readonly string[]      // comments the printer emits above the element
  readonly structuredData?: StructuredDataType   // already gated on `enabledBy`
  readonly key?: string
}

export type IRValue =
  | { kind: 'literal'; value: string | number | boolean }
  | { kind: 'expression'; code: string }
  | { kind: 'reference'; name: string }
```

## buildIR

Six passes, each independently testable.

### 1. Component boundary detection

Not every node becomes a component. Rules:

- The root becomes the entry component.
- A direct child of root whose block category is a section (`hero`, `marketing`, `navigation`)
  becomes its own component and its own file. This is what makes a Next.js export look like a
  real project rather than one 900-line page.
- A subtree repeated ≥ 2 times with identical structure (differing only in leaf values) becomes
  one component with props. This is the pass that turns three pricing cards into
  `<PlanCard plan={...} />` instead of three copy-pasted blocks.
- Everything else inlines into its parent.
- `singleFile: true` in options collapses all of it into one file.

### 2. Naming

```
"Hero"           → HeroSection      (category suffix added when the name is generic)
"Feature grid"   → FeatureGrid
"CTA"            → CtaSection
"hero 2"         → HeroSection2
""               → Section3         (falls back to block name + ordinal)
"class"          → ClassSection     (reserved word guard)
"1st section"    → Section1st       (must start with a letter)
```

`toComponentName` is pure, unit-tested, and guarantees: valid JS identifier, PascalCase, unique
within the export, stable across runs (same document → same names, always, so re-exporting
produces a clean diff).

File names are the kebab-case of the component name.

### 3. Class generation

Per node: resolve base props → Tailwind classes; resolve each responsive override → prefixed
classes; merge; order.

```ts
export function generateClasses(node: Node, def: BlockDefinition, theme: IRTheme): ClassResult
```

The prop-to-class mapping comes off the descriptor — `codegen.classes`, a list of `ClassRule`s the
block builds from the same object its `cva` call takes, so the canvas and the export cannot spend
different classes for the same prop value (ADR-225). `ClassResult` is the classes plus the CSS
variables and stylesheet rules the `custom` rules produced, because one walk of the props decides all
three.

- Ordering is **variant-major**: unprefixed classes first, then `sm:` → `2xl:`, and within one
  variant the order of Tailwind's core plugins. That is what `prettier-plugin-tailwindcss` emits, and
  matching the official sort means the output looks like it went through the plugin, because
  effectively it did. ADR-224 records why the group-major reading of this sentence was wrong.
- Redundant overrides (equal to the inherited value) are dropped.
- Values with no Tailwind equivalent become a CSS variable plus a rule in the emitted stylesheet —
  a `custom` rule on the descriptor. Never `[calc(100%-2.375rem)]` unless the user literally typed that.
- Duplicate/conflicting classes are resolved with `tailwind-merge` semantics at build time, so no
  runtime `cn()` is needed in the output.

### 4. Motion collection

Each node's motion specs produce `MotionCodegenFragment`s (see
[ANIMATION_SYSTEM.md](ANIMATION_SYSTEM.md)). This pass:

- Collects fragments and dedupes by content hash.
- Hoists shared variant/transition objects to module constants: eight `fade-up` sections emit
  **one** `const fadeUp = {...}` referenced eight times.
- Collects imports (`motion/react`, GSAP plugins).
- Collects keyframes and custom properties into the stylesheet.
- Emits reduced-motion handling: a `useReducedMotion()` call and a conditional variant, or a
  `@media (prefers-reduced-motion: reduce)` block for CSS-engine presets. **The export honours
  reduced motion or it is not shipping our animation.**

### 5. Import collection

```ts
export interface ImportSpec {
  readonly from: string
  readonly named?: readonly string[]
  readonly default?: string
  readonly typeOnly?: boolean
}
```

Merged per file, deduped, sorted (builtin → external → internal → relative), and `import type`
used where the specifier is type-only. Unused imports are impossible because they are collected
from actual usage, not predicted.

`dependencies` is accumulated with real semver ranges so the emitted `package.json` installs and
runs.

### 6. Asset handling

| Option | Behaviour |
| --- | --- |
| `assets: 'reference'` | Keep the original URLs |
| `assets: 'inline'` | Base64 data URLs (warns above 200 kB total) |
| `assets: 'bundle'` | Emit files into `public/` and rewrite paths (zip download only) |

`next/image` gets `width`, `height`, `alt`, `sizes`, and `placeholder="blur"` with the stored
`blurDataUrl`. Plain `img` gets `width`, `height`, `alt`, `loading="lazy"`, `decoding="async"`.
An asset with no `alt` produces a warning in the export report — not a silent empty string.

## Printers

### React

One file, or one file per component with a barrel.

```tsx
'use client'

import { motion, useReducedMotion } from 'motion/react'

const fadeUp = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
}

const fadeUpTransition = { duration: 0.6, ease: [0.16, 1, 0.3, 1] }

export interface HeroSectionProps {
  title?: string
  subtitle?: string
}

export function HeroSection({
  title = 'Design motion, ship code',
  subtitle = 'A visual editor for modern React interfaces.',
}: HeroSectionProps) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <section className="relative isolate overflow-hidden px-6 py-24 md:py-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-60 blur-3xl"
        style={{
          background:
            'radial-gradient(60% 60% at 30% 20%, oklch(62% 0.19 285) 0%, transparent 60%), radial-gradient(50% 50% at 75% 40%, oklch(70% 0.15 210) 0%, transparent 55%)',
        }}
      />
      <motion.div
        initial={shouldReduceMotion ? 'visible' : 'hidden'}
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        variants={fadeUp}
        transition={shouldReduceMotion ? { duration: 0 } : fadeUpTransition}
        className="mx-auto max-w-3xl text-center md:text-left"
      >
        <h1 className="text-balance text-5xl font-semibold tracking-tight md:text-6xl">
          {title}
        </h1>
        <p className="mt-6 text-lg text-neutral-400">{subtitle}</p>
      </motion.div>
    </section>
  )
}
```

Every detail here is a deliberate rule:

| Rule | Why |
| --- | --- |
| `'use client'` only when hooks or interactivity require it | A static section stays a Server Component |
| Props extracted with defaults | Immediately reusable, not a frozen snapshot |
| Named export, no default | Matches the codebase convention and tree-shakes |
| Hoisted variants and transitions | No inline object literals; readable and stable |
| `useReducedMotion` honoured | Accessible by default |
| `aria-hidden` on decorative layers | Screen readers skip the aurora |
| `-z-10` + `isolate` | No stacking-context surprises when dropped into a page |
| `text-balance` on headings | Typographic quality the user did not have to ask for |
| No editor artifacts | No `data-node-id`, no wrappers, no dead classes |

**Who decides the directive.** Not the printer, from the markup — the markup does not say whether the
component holds state. The block does, in `codegen.client`: `always`, `never`, or `whenAnyProp` with the
props that make it interactive (COMPONENT_LIBRARY.md § BlockDefinition). The printer emits the directive
when the block says so, or when the node carries motion, effects, or anything else that needs a hook —
either reason is sufficient and the two are independent.

A block whose descriptor **does not declare** `client` is an error, not a `never`: the printer reports it
and the export fails. The two available guesses are both wrong in one direction — assuming `never` ships a
page that throws in the browser, assuming `always` costs the reader every Server Component in the tree —
so the export refuses to make one (ADR-199).

One block's export is not its canvas markup: `modal-trigger` renders its dialog inside its own frame in the
canvas, because a modal cannot cover the editor, and the export portals to the document body and covers the
viewport (ADR-205). The descriptor's `notes` say so above the element.

**A block whose export cannot import what it needs** carries the code instead. `runtimeModule` on the
descriptor is a local module the printer writes beside the component — `theme-toggle` emits
`lib/color-mode.ts` and imports `setColorMode` from it, so an exported page's toggle actually works with no
dependency added (ADR-201). Two blocks asking for the same `path` emit it once.

### Next.js

```
app/
  layout.tsx           fonts, metadata, theme class
  page.tsx             composes the sections
  globals.css          tailwind + theme variables
components/
  hero-section.tsx
  feature-grid.tsx
  pricing-table.tsx
lib/
  motion.ts            shared variants and transitions
public/
  <bundled assets>
postcss.config.mjs     Tailwind v4 runs as a PostCSS plugin; without this the page has no utilities
tailwind.config.ts     only if the user asked for the config form
package.json
tsconfig.json          the `@/*` alias every printed import uses
README.md              what this is, how to run it
```

`postcss.config.mjs` is not optional and is not a preference. Tailwind v4 takes its configuration from
CSS — which is why `globals.css` opens with `@import 'tailwindcss'` and there is no config file by
default — and it generates nothing at all unless the PostCSS plugin is wired up. An export missing it
installs, builds and serves an unstyled page, which is the failure this whole section exists to prevent.

`page.tsx` is intentionally boring:

```tsx
import { HeroSection } from '@/components/hero-section'
import { FeatureGrid } from '@/components/feature-grid'

export default function Page() {
  return (
    <main>
      <HeroSection />
      <FeatureGrid />
    </main>
  )
}
```

That readability is the point. A reviewer should see structure immediately.

### HTML

Single self-contained `index.html`: `<style>` with reset + theme variables + generated rules +
keyframes, semantic markup, and a small vanilla `<script>` for interactions. No framework, no build
step, no CDN link, opens from the filesystem — and therefore no `dependencies`, which is a statement
rather than an omission.

Two options are **resolved** rather than offered for this target, and the dialog shows them as such:
`singleFile` is true because a single document has no module boundary to spend components on
(ADR-237), and `imageComponent` is `img` because `next/image` is a React component and a document
with no React in it would print `<image>`, which HTML reads as the SVG element (ADR-242).

#### The stylesheet

Classes become real CSS rules, generated from the IR's `usedClasses` and nothing else. Tailwind's CDN
build is not shipped: 3 MB and a network request in a file whose whole promise is that it is local.

Every themed declaration points at the `--ms-*` variable that `packages/tokens` § to-tailwind points
the same Tailwind namespace at — `rounded-lg` becomes `border-radius: var(--ms-radius-lg)`, never a
resolved `12px`. That is what keeps the HTML target painting what the React target paints, and it is
what keeps the colour-mode toggle working, since switching modes only moves variables (ADR-238). A
class the table does not know emits no rule and one `unsupported` warning naming it.

**Fonts** are the theme's system stack plus a commented-out `@font-face` the user can uncomment. A
Google Fonts URL would break the target's own promise twice — it needs a network, and it discloses
every visitor's IP to a third party from a file the user believes is local. `assets: 'inline'` is
meant to emit a base64 `woff2` subset instead; it currently emits the same stack and a warning,
because the repository holds no font binaries to encode (ADR-241). The emitted CSS carries a
one-line comment stating which mode produced it.

#### Motion

CSS-engine presets translate directly: their fragments already produced classes and keyframes, and
`buildIR` already put both in the stylesheet. Motion-engine and GSAP presets are approximated or
omitted by `printers/html/approximate-motion.ts`, which reads `IRElement.motion` — the preset ids
pass 4 recorded (ADR-239) — and never the baked attributes.

| Preset | CSS approximation | Warning |
| --- | --- | --- |
| `fade`, `fade-up` | `.ms-reveal` + `IntersectionObserver` | none — faithful |
| `blur-in`, `clip-reveal` | the same, with a modifier class | none — faithful |
| `scale-in`, `flip-in`, `scale-hover` | overshoot bezier | "approximated: spring physics → bezier" |
| `magnetic`, `liquid` | `transform` on hover | "approximated: no cursor tracking" |
| `sticky-stack` | `position: sticky` + scroll-linked class | "approximated: no scale interpolation" |
| `counter`, `typewriter`, `text-scramble` | omitted | "omitted: needs a per-frame script" |
| `scroll-timeline`, `horizontal-scroll` | omitted | "omitted: requires a scroll timeline" |
| `particles` | omitted | "omitted: requires WebGL" |

A preset the table does not name degrades by engine and says so, so a new preset is loud rather than
silent. Every approximation and omission appears in the export warnings, once per preset.

#### Behaviour, and the `data-ms-*` contract

The script is assembled per feature and only when the document contains what the feature drives.
Animation sits inside `if (!matchMedia('(prefers-reduced-motion: reduce)').matches)`. **Function sits
outside it** — an accordion that stops opening because the reader asked for less motion is a broken
page, not a considerate one. Target: under 3 kB for a typical landing page. Past that, something is
being reimplemented in JavaScript that belongs in CSS.

| Feature | Driven by | Implementation |
| --- | --- | --- |
| Entrance animations | `.ms-reveal`, from the motion table | `IntersectionObserver` adding `is-visible` |
| Cursor effects | `.ms-pointer`, from the motion table | one `pointermove` writing `--ms-pointer-x/y` |
| Sticky stack | `.ms-sticky`, from the motion table | `IntersectionObserver` toggling `is-stuck` |
| Theme toggle | `data-ms-color-mode-toggle` | `localStorage` + `data-color-mode` + `aria-pressed` |
| Accordion / tabs | `data-ms-disclosure` on the container | delegated click, `aria-expanded` + `hidden` |
| Carousel | `data-ms-carousel` | native scroll-snap; `data-ms-carousel-step` calls `scrollBy` |
| Mobile menu | `data-ms-menu` | class toggle + `aria-expanded` + focus trap |
| Hover effects, marquee | classes only | pure CSS |

The last four hang off attributes rather than off block ids, so the contract is readable in the
emitted HTML and a block that starts emitting one starts working with no change to the printer. **No
block emits them yet** — a block descriptor describes its root element only, which is the open
escalation this target inherits: the interactions are implemented and unreachable until a block's
internal markup is specified.

`.ms-reveal` starts at zero opacity and the observer is what clears it, so two fallbacks are not
optional: the stylesheet's `prefers-reduced-motion` block sets the visible state, and a `<noscript>`
block does the same for a reader with no JavaScript. Without either, the page is blank for them.

### JSON

`serializeDocument` from [FILE_FORMAT.md](FILE_FORMAT.md). Byte-stable, and delegated rather than
reimplemented — a second serialiser would drift from that guarantee. This target reads no
`CodegenIR` at all, because nothing the IR decides appears in its output (ADR-240).

### Tokens

The resolved theme as CSS variables, a Tailwind config, JSON, or Figma Tokens format.

The four generators live in `packages/theme/src/export/` and take one `ThemeExport`, so the formats
cannot disagree — [THEME_ENGINE.md](THEME_ENGINE.md) § Theme in export. `packages/codegen` writes
none of them: the printed strings arrive on `PrintedTheme.tokens` the way the stylesheet arrives on
`PrintedTheme.css`, and this target decides which files exist and in what order (ADR-236).

## Options

```ts
export interface ExportOptions {
  target: 'react' | 'next' | 'html' | 'json' | 'tokens'
  language: 'ts' | 'js'
  singleFile: boolean
  includeMotion: boolean
  includeTheme: boolean
  extractProps: boolean
  assets: 'reference' | 'inline' | 'bundle'
  imageComponent: 'next-image' | 'img'
  format: boolean
  scope: 'document' | 'selection'
}
```

`scope: 'selection'` is what powers **Copy React** on a single node — the same pipeline, one
subtree. There is exactly one code path, so the button in the context menu cannot drift from the
export dialog.

`resolveOptions` is the one place a target may narrow a field, and it does so twice, both for `html`:
`singleFile` to true and `imageComponent` to `img`. The dialog reads the resolved set, so a control a
target fixes reads as fixed rather than as a choice that is quietly ignored.

### There is no styling option, and that is a structural fact

Tailwind is not a formatting preference applied at print time — it is the model the IR is built on.
`generateClasses` (pass 3) resolves props and responsive overrides directly into Tailwind's class
vocabulary and its group ordering, and `tailwind-merge` semantics resolve conflicts at build time so
the output needs no runtime helper.

CSS Modules or vanilla-extract output would need a different pass 3 entirely: scoped class-name
generation, a declaration model instead of a utility vocabulary, media queries instead of breakpoint
prefixes, and its own conflict resolution. That is a second IR pass, not a second printer.

So the honest statement is: **Tailwind is a v1 constraint, not a v1 option.** The HTML target already
proves the alternative is reachable — it generates real CSS rules from `usedClasses` — but it does so
by flattening to a single document, which is not what a CSS Modules consumer wants.

Anyone who wants this later should read [ROADMAP.md](ROADMAP.md) § Post-v1 for the actual scope
before promising it to someone. Offering a `styling` option that silently only honours one value
would be worse than not offering it.

## Formatting

Prettier standalone (`prettier/standalone` + the estree, typescript, html, css, and postcss
plugins), dynamically imported. ~180 kB, and it only loads when the user exports.

If Prettier fails to load (offline), unformatted output ships with a warning. Working
unformatted code beats a failed export.

## Warnings

The export dialog shows a warning list before the code. Categories:

| Warning | Example |
| --- | --- |
| `approximation` | "HTML export approximates the `magnetic` hover with a CSS transition." |
| `missing-alt` | "3 images have no alt text." |
| `contrast` | "Accent on surface-1 is 3.4:1 — below AA for body text." |
| `unsupported` | "`particles` requires WebGL and is omitted from the HTML export." |
| `dependency` | "Adds `gsap@^3.12` (~60 kB gzip)." |
| `perf` | "6 blur animations may drop frames on low-end devices." |
| `a11y` | "`hero-video` has no captions track." |

Warnings never block. They inform, and each links to the relevant doc section.

One `unsupported` warning is per node rather than per document: the props that reached neither a class
rule nor `passthroughProps`, listed by name. A block's descriptor describes its root element, so a
content prop with no route into the markup would otherwise vanish and print a blank section — ADR-229.

## Export dialog

```
┌──────────────────────────────────────────────────────────────────┐
│ Export                                                    [✕]    │
├──────────────────┬───────────────────────────────────────────────┤
│ ● React          │  app/page.tsx                        [copy]   │
│ ○ Next.js        │ ┌───────────────────────────────────────────┐ │
│ ○ HTML           │ │ import { HeroSection } from '@/components…│ │
│ ○ JSON           │ │                                           │ │
│ ○ Tokens         │ │ export default function Page() {           │ │
│                  │ │   return (                                 │ │
│ Language  TS  JS │ │     <main>                                 │ │
│ ☑ Motion         │ │       <HeroSection />                      │ │
│ ☑ Theme          │ └───────────────────────────────────────────┘ │
│ ☑ Extract props  │                                               │
│ ☐ Single file    │  Files                                        │
│ Images  next  img│  ├ app/layout.tsx            1.2 kB           │
│                  │  ├ app/page.tsx              0.4 kB           │
│ ⚠ 2 warnings     │  ├ components/hero-section.tsx  2.8 kB        │
│                  │  └ package.json              0.3 kB           │
├──────────────────┴───────────────────────────────────────────────┤
│                         [ Copy all ]  [ Download .zip ]          │
└──────────────────────────────────────────────────────────────────┘
```

- Opens instantly; generation streams in with per-file skeletons.
- Changing an option regenerates only what is affected (memoised on an option hash).
- Syntax highlighting via `shiki` at build time for the sample, `prism`-lite at runtime for
  generated code — dynamically imported.
- `jszip` loads only on the zip download.

## Testing

**Golden files** are the backbone. `packages/codegen/src/__golden__/`:

```
__golden__/
├── documents/
│   ├── single-hero.motion.json
│   ├── full-landing.motion.json
│   ├── nested-containers.motion.json
│   ├── all-motion-presets.motion.json
│   ├── responsive-overrides.motion.json
│   └── repeated-subtrees.motion.json
└── expected/
    ├── single-hero/react/hero-section.tsx
    ├── single-hero/next/app/page.tsx
    ├── single-hero/html/index.html
    └── ...
```

Each `(document × target × option-set)` pair has an expected output asserted exactly. Updating a
golden file requires reading the diff — that is the review gate on generated code quality, and it
is the mechanism that keeps the output from slowly degrading.

**Compilation tests.** For every golden React and Next output, run `tsc --noEmit` against it in a
fixture project with the declared dependencies installed. A generated file that does not
type-check fails CI. This is the test that makes "compiles with zero edits" a fact rather than an
aspiration.

**Unit tests.** `toComponentName` (30 cases), `generateClasses` (ordering, redundancy, arbitrary
fallback), import merging, subtree dedupe detection, motion hoisting, asset handling.

**E2E.** Export each target from the studio, assert the file list and that the clipboard contains
the expected first line.

**Smoke.** A weekly CI job scaffolds a fresh `create-next-app`, drops in the Next export of
`full-landing`, installs, builds, and runs Lighthouse on it. The exported page must itself score
≥ 90. Our export producing a slow page would be the deepest kind of failure.
