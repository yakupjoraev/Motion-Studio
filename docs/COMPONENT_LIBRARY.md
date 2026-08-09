# COMPONENT_LIBRARY

`packages/blocks` is the registry: the things a user can place. A block is a **pure
presentational React component of its props**, plus metadata describing how to edit and how to
export it.

A block must not know it is in an editor. That is the property that makes export honest — the
same component runs in the canvas and in the user's app.

## Anatomy

```
packages/blocks/src/marketing/pricing-table/
├── pricing-table.tsx          the component
├── pricing-table.types.ts     props type (inferred from the schema)
├── pricing-table.schema.ts    zod schema + control metadata
├── pricing-table.styles.ts    cva variants
├── pricing-table.motion.ts    default motion specs
├── pricing-table.definition.ts  the BlockDefinition
├── pricing-table.stories.tsx  Storybook
├── pricing-table.test.tsx     render + a11y smoke test
└── index.ts
```

## BlockDefinition

```ts
export interface BlockDefinition<P = UnknownProps> {
  readonly id: BlockId
  readonly name: string
  readonly description: string
  readonly category: BlockCategory
  readonly tags: readonly string[]
  readonly icon: IconName

  readonly propsSchema: ZodType<P>
  readonly defaults: P
  readonly previewProps: P              // what the palette thumbnail shows

  readonly slots: readonly SlotDefinition[]
  readonly controls: readonly ControlGroup[]
  readonly capabilities: BlockCapabilities
  readonly defaultMotion: Partial<Record<MotionChannel, MotionSpec>>
  readonly codegen: CodegenDescriptor
  readonly a11y: A11yNotes
}

export interface SlotDefinition {
  readonly name: string
  readonly label: string
  readonly accepts: readonly BlockId[] | '*' | ((def: BlockDefinition) => boolean)
  readonly minChildren: number
  readonly maxChildren: number | null
  readonly defaultChildren?: readonly BlockId[]
}

export interface BlockCapabilities {
  readonly resizable: boolean
  readonly fullWidth: boolean
  readonly requiresBackdrop: boolean       // glass blocks
  readonly supportsMotion: readonly MotionChannel[]
  readonly costClass: 'cheap' | 'moderate' | 'heavy'
  readonly minWidth?: number
}
```

## Controls drive the inspector

The inspector is **generated**, not written per block. Control metadata lives with the schema, so
adding a prop and adding its UI is one change.

```ts
// pricing-table.schema.ts
export const pricingTableSchema = z.object({
  layout: z.enum(['cards', 'table', 'compact']).default('cards'),
  columns: z.number().int().min(1).max(4).default(3),
  highlightIndex: z.number().int().min(-1).default(1),
  currency: z.string().default('$'),
  interval: z.enum(['month', 'year']).default('month'),
  showToggle: z.boolean().default(true),
  glass: z.boolean().default(false),
  plans: z.array(planSchema).min(1).max(4),
})

export const pricingTableControls: ControlGroup[] = [
  {
    id: 'layout',
    label: 'Layout',
    controls: [
      { path: 'layout', kind: 'segmented', label: 'Style', options: LAYOUT_OPTIONS },
      { path: 'columns', kind: 'stepper', label: 'Columns', min: 1, max: 4, responsive: true },
      { path: 'highlightIndex', kind: 'select', label: 'Highlight', optionsFrom: 'plans' },
    ],
  },
  {
    id: 'style',
    label: 'Style',
    controls: [
      { path: 'glass', kind: 'switch', label: 'Glass', hint: 'Needs a background behind it' },
    ],
  },
  {
    id: 'content',
    label: 'Content',
    controls: [
      { path: 'currency', kind: 'text', label: 'Currency', maxLength: 3 },
      { path: 'interval', kind: 'segmented', label: 'Interval', options: INTERVAL_OPTIONS },
      { path: 'showToggle', kind: 'switch', label: 'Interval toggle' },
      { path: 'plans', kind: 'list', label: 'Plans', itemSchema: planSchema, max: 4,
        itemControls: PLAN_CONTROLS, sortable: true },
    ],
  },
]
```

### Control kinds

| Kind | Renders | Props |
| --- | --- | --- |
| `text` | Single-line input | `maxLength`, `placeholder` |
| `textarea` | Multi-line, auto-growing | `rows`, `maxLength` |
| `richText` | Inline formatting (bold, italic, link) | |
| `number` | Scrub field | `min`, `max`, `step`, `unit`, `precision` |
| `slider` | Slider + number | `min`, `max`, `step` |
| `stepper` | −/+ with value | `min`, `max` |
| `select` | Dropdown | `options` or `optionsFrom` |
| `segmented` | Segmented control | `options` (≤ 4) |
| `switch` | Toggle | `hint` |
| `color` | Colour picker with token presets | `alpha`, `tokens` |
| `gradient` | Gradient editor with a stop track | `kinds` |
| `shadow` | Shadow stack editor | `max` |
| `spacing` | 4-side box editor with a link toggle | `linked` |
| `radius` | 4-corner editor with a link toggle | |
| `align` | 3×3 alignment grid | |
| `font` | Family / size / weight / spacing group | |
| `image` | Upload / URL / unsplash-style picker | `aspect` |
| `icon` | Icon picker | |
| `link` | URL + target + rel | |
| `list` | Repeatable items | `itemSchema`, `itemControls`, `max`, `sortable` |
| `motion` | Preset picker + params | `channels` |
| `effect` | Effect picker + params | |
| `css` | Raw CSS escape hatch, validated | `properties` |

Every kind has one implementation in `packages/ui/src/controls/`. Adding a block never means
writing an inspector.

`responsive: true` on a control means the inspector shows the breakpoint override affordance for
it. Layout and size controls are responsive; content controls usually are not.

## Writing a block

```tsx
// pricing-table.tsx
export function PricingTable({
  layout, columns, highlightIndex, currency, interval, showToggle, glass, plans,
}: PricingTableProps) {
  const [activeInterval, setActiveInterval] = useState(interval)

  return (
    <section className={sectionVariants({ layout })}>
      {showToggle && (
        <IntervalToggle value={activeInterval} onChange={setActiveInterval} />
      )}
      <div className={gridVariants({ columns })}>
        {plans.map((plan, i) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            currency={currency}
            interval={activeInterval}
            highlighted={i === highlightIndex}
            glass={glass}
          />
        ))}
      </div>
    </section>
  )
}
```

### Rules

1. **Props in, JSX out.** No store access, no editor imports, no `window` in render.
2. **Local UI state is allowed** (a tab index, an interval toggle) because the exported component
   needs it too. Editor state is not.
3. **Tailwind classes only** — the export target is Tailwind. No inline styles except for
   genuinely dynamic values, which go through CSS variables.
4. **Tokens only.** No raw colours, no arbitrary spacing that should be a token.
5. **Responsive by construction.** Every block is usable at 360 px. The responsive engine adds
   *overrides*, it does not rescue a block that only works at 1440 px.
6. **Semantic HTML.** `section`, `article`, `nav`, `h1`–`h6` in order, `button` for actions,
   `a` for navigation.
7. **Motion via `MotionNode`,** never a hard-coded `motion.div` with inline animation. The block
   declares `defaultMotion`; the resolver applies it.
8. **Slots render `children`,** so the editor's tree and the block's layout stay the same tree.
9. **No layout-affecting animation.** Transform, opacity, filter, clip-path only.
10. **Every image carries `sizes`, explicit `width`/`height`, and an honest priority hint.** The
    element in the block is a plain `<img>`; the codegen descriptor says whether the *export* emits
    `next/image` or an `img`. A block takes no framework dependency — it renders in the studio, in
    Storybook and in jsdom, and only one of those three has a Next runtime. See ADR-119.

## Catalogue

62 blocks in v1. Each row is a real registry entry with a schema, defaults, controls, and codegen.

### Layout (7)
`section` · `container` · `stack` · `grid` · `columns` · `spacer` · `divider`

### Hero (6)
`hero-centered` · `hero-split` · `hero-aurora` · `hero-video` · `hero-terminal` · `hero-app-preview`

All six share one copy stack — eyebrow, the single `<h1>`, subtitle, CTA pair, optional trust row —
rendered by `hero/hero-copy.tsx` and typed by the fragments in `hero/hero.schema.ts`, so the vertical
rhythm is one decision rather than six transcriptions of it (ADR-118).

**The LCP rule, as it actually holds:** no decoration a hero draws can be the largest contentful
paint. Every decorative layer is `aria-hidden`, has no content, is painted behind by z-index rather
than by DOM order, and is a gradient — which is not an LCP candidate at all. Where a *user* supplies
an image the image may win LCP, and the block optimises for that rather than denying it. ADR-120
carries the measurements.

### Content (9)
`heading` · `text` · `rich-text` · `image` · `video` · `code-block` · `quote` · `stat` · `badge`

### Marketing (12)
`feature-grid` · `feature-split` · `bento-grid` · `pricing-table` · `testimonial-card` ·
`testimonial-marquee` · `logo-cloud` · `cta-banner` · `cta-split` · `faq-accordion` ·
`comparison-table` · `newsletter-form`

### Navigation (6)
`navbar` · `navbar-floating` · `sidebar-nav` · `footer` · `breadcrumbs` · `dock`

### Interactive (9)
`button` · `button-group` · `tabs` · `accordion` · `carousel` · `modal-trigger` · `tooltip-target` ·
`command-menu-preview` · `theme-toggle`

### Data (5)
`table` · `stat-grid` · `progress-ring` · `timeline` · `chart-preview`

### Forms (5)
`input-field` · `select-field` · `checkbox-field` · `contact-form` · `waitlist-form`

### Effects (13)
Attach to a node rather than replacing it. Rendered as an absolutely-positioned layer inside the
target with `pointer-events: none`.

`aurora-background` · `mesh-gradient` · `noise-overlay` · `grain-overlay` · `dot-grid` ·
`grid-lines` · `spotlight` · `beams` · `glow` · `border-beam` · `shine` · `particles` · `scanlines`

The visual bar for this category is set by [impeccable.style](https://impeccable.style) and the
other references in [DESIGN_REFERENCES.md](DESIGN_REFERENCES.md). **Read that document before
building any effect** — it defines the look-understand-build workflow, the mandatory licence check,
and the eight ways our version must exceed a reference implementation (schema-parameterised, live
tunable, reduced-motion correct, within the scheduler caps, exportable, contrast-checked,
light-and-dark, accessible).

Effects have their own instance shape:

```ts
export interface EffectInstance {
  readonly id: string
  readonly effectId: EffectId
  readonly params: Readonly<Record<string, unknown>>
  readonly layer: 'behind' | 'front'
  readonly blendMode: BlendMode
  readonly opacity: number
}
```

A node can carry multiple effects, ordered. The inspector's Effects section is a stack editor —
add, reorder, remove, tune, toggle.

## Registry construction

```ts
// packages/blocks/src/registry.ts
import * as layout from './layout'
import * as hero from './hero'
// ...

const DEFINITIONS = [
  ...Object.values(layout.definitions),
  ...Object.values(hero.definitions),
  // ...
] as const

export const blockRegistry: BlockRegistry = createRegistry(DEFINITIONS)

export const renderRegistry: RenderRegistry = {
  ...layout.components,
  ...hero.components,
  // ...
}
```

Two exports, deliberately separate:

- `blockRegistry` — metadata only. Serializable, importable by `codegen` and the editor,
  **contains no React**.
- `renderRegistry` — the components. Only the canvas and previews need it.

That split is what lets `codegen` run in a `node` test and lets export work without loading 62
components.

A build-time check asserts the two maps have identical key sets. A definition without a component
or vice versa fails the build.

## Lazy loading

Heavy blocks (`particles`, `mesh-gradient`, `chart-preview`, `hero-video`) are dynamically
imported:

```ts
export const components: RenderRegistry = {
  'hero-centered': HeroCentered,
  'particles': lazy(() => import('./effects/particles')),
}
```

Wrapped in `Suspense` with a token-coloured skeleton at the exact final size, so no layout
shift. The palette thumbnail is a static image, so browsing never loads the heavy code.

## Thumbnails

Each block ships a static WebP thumbnail (`320 × 200`, quality 82) per colour mode, with a blur
placeholder in `apps/web/public/thumbnails/thumbnails.json`.

`pnpm generate:thumbnails` regenerates them by rendering `previewProps` through the Storybook build
and driving Chrome over CDP — no Playwright, because the only thing it would add is video recording
and Chrome encodes WebP natively (ADR-125). `--verify` runs the whole thing twice and fails if a
single byte differs; the output is committed, so a generator that churned would be worse than none.
`--block <id>` regenerates one.

`pnpm check:registry` is the CI gate: every block has both thumbnails and a manifest entry, the
dimensions are the documented ones, and no thumbnail outlives the block it was made for. It is a
presence-and-consistency check — proving a thumbnail still matches what its block renders would mean
rendering it, which needs a browser, and that stays in the generator.

**The animated hover clip is not shipped yet.** A recorded WebM carries encoder timestamps and cannot
be made byte-identical between runs, which is the one property the rest of this pipeline is built
around. ADR-125 records what it would take; `ROADMAP.md` carries it.

## Testing

Per block, minimum:

```tsx
describe('PricingTable', () => {
  it('renders every plan', () => {
    render(<PricingTable {...definition.defaults} />)
    expect(screen.getAllByRole('article')).toHaveLength(definition.defaults.plans.length)
  })

  it('has no axe violations', async () => {
    const { container } = render(<PricingTable {...definition.defaults} />)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('validates its own defaults', () => {
    expect(() => definition.propsSchema.parse(definition.defaults)).not.toThrow()
  })
})
```

Plus registry-wide tests that run over **every** definition:

- `defaults` parses against `propsSchema`
- `previewProps` parses against `propsSchema`
- Every `controls[].path` exists in the schema
- Every `slots[].accepts` references real block ids
- `codegen` produces a golden-file-matching output for `defaults`
- `defaultMotion` references real presets, and every channel is in `capabilities.supportsMotion`
- A thumbnail exists
- `a11y` notes are non-empty

These meta-tests are worth more than the individual ones — they make it impossible to add a
half-finished block.

## Adding a block

1. Create the directory with the nine files above.
2. Write the schema first. It is the contract.
3. Write the component against the schema's inferred type.
4. Write `controls` — group into Layout / Style / Content.
5. Declare `slots` if it accepts children.
6. Declare `capabilities` including the cost class.
7. Write the `codegen` descriptor and run `pnpm test:codegen -u` to create the golden file, then
   **read the generated output** and confirm you would accept it in review.
8. Story, tests, thumbnail.
9. Add to the category index and the catalogue table above.
