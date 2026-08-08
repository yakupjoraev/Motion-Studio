# ANIMATION_SYSTEM

Animation is the product. It is therefore **data**, not code sprinkled through components.

A block never hard-codes an animation. It receives a resolved motion config and applies it. This
is what makes the motion panel possible, what makes presets swappable at runtime, and what makes
codegen able to emit the animation as source.

## The model

```
MotionSpec (document)  ──resolve──►  ResolvedMotion  ──apply──►  Motion / GSAP / CSS
   preset id                            variants
   parameters                           transition
   channel                              listeners
   trigger                              css variables
```

```ts
// packages/schema/src/motion/motion.types.ts — a MotionSpec is a *document* shape, so it lives in
// `schema` with the rest of the format and `packages/motion` reads it. The dependency runs
// schema → motion; declaring it in `motion` would invert that and make the file format depend on
// the engine that plays it.
export interface MotionSpec {
  presetId: MotionPresetId
  channel: MotionChannel
  trigger: MotionTrigger
  params: Record<string, number | string | boolean>
  stagger?: { each: number; from: 'first' | 'last' | 'center' }
  disabled?: boolean
}

export type MotionChannel = 'entrance' | 'scroll' | 'hover' | 'press' | 'cursor' | 'continuous' | 'exit'

export type MotionTrigger =
  | { kind: 'mount' }
  | { kind: 'inView'; amount: number; once: boolean; margin: string }
  | { kind: 'scrollProgress'; start: string; end: string }
  | { kind: 'hover' }
  | { kind: 'press' }
  | { kind: 'pointerMove'; within: 'element' | 'viewport' }
  | { kind: 'always' }
```

## Preset definition

```ts
export interface MotionPreset<P extends PresetParams = PresetParams> {
  readonly id: MotionPresetId
  readonly name: string
  readonly channel: MotionChannel
  readonly engine: 'motion' | 'gsap' | 'css'
  readonly paramsSchema: ZodType<P>
  readonly defaults: P
  readonly controls: readonly ControlDescriptor[]   // drives the inspector
  readonly capabilities: {
    composableWith: readonly MotionChannel[]
    requiresLayoutId?: boolean
    requiresChildren?: boolean
    gpuHeavy?: boolean
  }
  resolve(params: P, ctx: ResolveContext): ResolvedMotion
  resolveReduced(params: P, ctx: ResolveContext): ResolvedMotion
  codegen(params: P, ctx: CodegenContext): MotionCodegenFragment
}
```

Four things every preset must supply:

1. `resolve` — the full experience.
2. `resolveReduced` — the reduced-motion experience. **Not optional.** A preset without one
   fails review. Usually: keep opacity, drop transform; or keep the end state instantly.
3. `codegen` — how it appears in exported source. Without this the export is a lie.
4. `controls` — inspector metadata, so the motion panel is generated, not hand-built.

## Curves

One shared vocabulary. Presets compose from it; they do not invent bezier values.

```ts
// packages/motion/src/curves/easings.ts
export const EASINGS = {
  linear: [0, 0, 1, 1],
  standard: [0.2, 0, 0, 1],
  decelerate: [0, 0, 0.2, 1],
  accelerate: [0.4, 0, 1, 1],
  emphasized: [0.2, 0, 0, 1],
  emphasizedDecelerate: [0.05, 0.7, 0.1, 1],
  emphasizedAccelerate: [0.3, 0, 0.8, 0.15],
  overshoot: [0.34, 1.56, 0.64, 1],
  bounce: [0.68, -0.55, 0.27, 1.55],
  anticipate: [0.38, -0.4, 0.2, 1.4],
  expoOut: [0.16, 1, 0.3, 1],
  circOut: [0, 0.55, 0.45, 1],
} as const
```

```ts
// packages/motion/src/curves/springs.ts
export const SPRINGS = {
  gentle:  { stiffness: 120, damping: 20, mass: 1 },
  smooth:  { stiffness: 180, damping: 24, mass: 1 },
  snappy:  { stiffness: 300, damping: 26, mass: 0.9 },
  bouncy:  { stiffness: 400, damping: 18, mass: 1 },
  stiff:   { stiffness: 550, damping: 32, mass: 0.8 },
  wobbly:  { stiffness: 220, damping: 12, mass: 1.2 },
  molasses:{ stiffness: 60,  damping: 26, mass: 1.6 },
} as const
```

The inspector's spring control draws the actual response curve by numerically integrating the
spring — that is `simulateSpring(config, dt, steps)` in `packages/motion/src/curves/simulate.ts`,
a pure function with unit tests. Dragging stiffness redraws the curve in real time, which is the
only way a user can develop intuition for these numbers.

## Preset catalogue

### Entrance (`channel: 'entrance'`)

| Preset | Effect | Key params |
| --- | --- | --- |
| `fade` | Opacity 0→1 | `duration`, `delay`, `easing` |
| `fade-up` | Opacity + Y translate | `distance`, `duration`, `easing` |
| `fade-down` / `fade-left` / `fade-right` | Directional variants | same |
| `scale-in` | Scale + opacity | `from`, `spring` |
| `blur-in` | Blur 12px→0 + opacity | `blur`, `duration` |
| `clip-reveal` | `clip-path` inset wipe | `direction`, `duration`, `easing` |
| `text-reveal` | Per-line mask reveal | `stagger`, `by: line \| word \| char` |
| `flip-in` | `rotateX` + perspective | `angle`, `spring` |
| `stagger-children` | Orchestrates children | `each`, `from`, `childPreset` |
| `draw-line` | SVG `pathLength` 0→1 | `duration`, `easing` |
| `counter` | Numeric count-up | `from`, `to`, `duration`, `format` |

### Scroll (`channel: 'scroll'`)

| Preset | Effect | Key params |
| --- | --- | --- |
| `parallax` | Y offset by scroll progress | `speed`, `axis`, `clamp` |
| `scroll-fade` | Opacity by progress | `start`, `end` |
| `scroll-scale` | Scale by progress | `from`, `to` |
| `scroll-rotate` | Rotate by progress | `degrees` |
| `sticky-stack` | Cards stack and scale as they pin | `offset`, `scaleStep` |
| `progress-bar` | Width from page progress | `axis` |
| `horizontal-scroll` | Pinned horizontal track (GSAP) | `distance`, `snap` |
| `scroll-timeline` | Multi-keyframe scrub (GSAP) | `keyframes[]` |
| `marquee` | Infinite loop, speed-modulated by scroll | `speed`, `direction`, `pauseOnHover` |

### Hover (`channel: 'hover'`)

| Preset | Effect | Key params |
| --- | --- | --- |
| `lift` | Y + shadow increase | `distance`, `shadow` |
| `scale-hover` | Scale up | `scale`, `spring` |
| `magnetic` | Element leans toward cursor | `strength`, `radius`, `spring` |
| `tilt-3d` | `rotateX/Y` from cursor position | `maxTilt`, `perspective`, `glare` |
| `liquid` | Border-radius morph + skew | `intensity`, `spring` |
| `glow-hover` | Accent glow bloom | `size`, `intensity` |
| `border-beam` | Gradient border travels the perimeter | `duration`, `width`, `colors` |
| `shine` | Diagonal specular sweep | `angle`, `duration` |
| `underline-grow` | Underline scales from origin | `origin`, `thickness` |
| `icon-swap` | Cross-fade + slide two icons | `direction` |
| `text-scramble` | Character scramble to final text | `speed`, `charset` |

### Cursor (`channel: 'cursor'`)

| Preset | Effect | Key params |
| --- | --- | --- |
| `spotlight` | Radial light follows cursor | `radius`, `intensity`, `color` |
| `cursor-follow` | A satellite element trails the cursor | `lag`, `size` |
| `cursor-glow` | Blurred blob under the cursor | `size`, `blur`, `opacity` |
| `gradient-follow` | Gradient origin tracks cursor | `spread` |
| `mask-reveal` | Cursor reveals a hidden layer through a mask | `radius`, `feather` |

### Continuous (`channel: 'continuous'`)

| Preset | Effect | Key params |
| --- | --- | --- |
| `float` | Slow sinusoidal Y | `distance`, `duration` |
| `pulse` | Scale/opacity breathe | `scale`, `duration` |
| `aurora` | Animated mesh gradient drift | `speed`, `blur`, `colors` |
| `gradient-shift` | `background-position` cycle | `duration`, `angle` |
| `orbit` | Children orbit a centre | `radius`, `duration`, `count` |
| `noise-shift` | Grain layer animates | `speed`, `amount` |
| `beam` | Light beam sweeps a surface | `duration`, `angle`, `width` |
| `typewriter` | Cycles through phrases | `speed`, `phrases[]`, `caret` |

**`continuous` presets are the ones that burn battery.** Every one of them:
- pauses when off-screen (a shared `IntersectionObserver`),
- pauses when the tab is hidden,
- is fully disabled under reduced motion (not slowed — stopped),
- is capped: no more than 6 continuous presets active in a viewport, enforced by the scheduler.

### Exit (`channel: 'exit'`)

`fade-out`, `scale-out`, `slide-out`, `blur-out`, `collapse`. Used via `AnimatePresence`.

## Reduced motion

```ts
// packages/motion/src/reduced/policy.ts
export function reduce(spec: ResolvedMotion, policy: ReducePolicy): ResolvedMotion
```

Policy per channel:

| Channel | Reduced behaviour |
| --- | --- |
| `entrance` | Opacity only, 120 ms. No transform, no blur, no clip. |
| `scroll` | Static at the end state. No scrub, no parallax, no pinning. |
| `hover` | Colour and shadow only. No transform. |
| `press` | Opacity/colour change only. |
| `cursor` | Disabled entirely. |
| `continuous` | Disabled entirely. |
| `exit` | Instant. |

Detection is centralised — exactly one `matchMedia` subscription in the app:

```ts
export function useReducedMotion(): boolean   // packages/motion/src/reduced/use-reduced-motion.ts
```

Plus a studio override so a designer can preview the reduced experience. `motionScale: 0` in the
theme produces the same result through the CSS-variable path, so both mechanisms converge.

## The scheduler

Naive implementation: every scroll preset creates an `IntersectionObserver` and a scroll
listener. With 40 animated nodes that is 40 observers and 40 listeners. Instead:

```ts
// packages/motion/src/scheduler/scheduler.ts
export interface MotionScheduler {
  observe(el: Element, onVisibility: (visible: boolean, ratio: number) => void): () => void
  onScroll(cb: (progress: ScrollProgress) => void): () => void
  onPointerMove(cb: (point: Point) => void): () => void
  onFrame(cb: (dt: number) => void): () => void
}
```

- **One** `IntersectionObserver` per threshold bucket, shared by all consumers.
- **One** passive `scroll` listener, batched into a single `rAF`, distributing progress.
- **One** `pointermove` listener at the document level, throttled to `rAF`, distributing
  coordinates. Cursor presets read from it and write CSS variables directly.
- **One** `rAF` loop for continuous animations, which ticks callbacks and skips off-screen ones.
- The loop stops entirely when nothing is registered and on `visibilitychange`.

This is the difference between 60 fps and 22 fps with a full page of effects. It is also why the
scheduler has its own unit tests — the sharing logic is where bugs hide.

## Applying motion

```tsx
// packages/motion/src/apply/motion-node.tsx
export function MotionNode({ spec, children, className }: MotionNodeProps) {
  const reduced = useReducedMotion()
  const scale = useMotionScale()
  const resolved = useResolvedMotion(spec, { reduced, scale })

  if (resolved.engine === 'css') return <CssMotion resolved={resolved} className={className}>{children}</CssMotion>
  if (resolved.engine === 'gsap') return <GsapMotion resolved={resolved} className={className}>{children}</GsapMotion>
  return <FramerMotion resolved={resolved} className={className}>{children}</FramerMotion>
}
```

`useResolvedMotion` memoises on `(presetId, params hash, reduced, scale)`. Resolution is pure and
tested in `node`.

### Engine selection

| Engine | Use when |
| --- | --- |
| `css` | Hover, press, and simple continuous effects expressible as a transition/keyframes. Cheapest — no JS on the interaction path. |
| `motion` | Entrance, exit, layout, spring physics, in-view triggers, gesture variants. The default. |
| `gsap` | Scroll-scrubbed timelines with pinning, multi-element choreography, character splitting. Dynamically imported. |

**One engine owns an element.** Never animate the same property from two engines — they fight
over `transform` and the result is nondeterministic. The resolver validates this and throws in
development if a document assigns conflicting channels to one node.

## GPU discipline

Animate only `transform`, `opacity`, `filter`, and `clip-path`. Never `width`, `height`, `top`,
`left`, `margin`, or anything that triggers layout.

- `will-change` is applied **on interaction start and removed on end**, never left in the
  stylesheet. A permanent `will-change` on 40 elements is a memory problem, not an optimisation.
- Presets marked `gpuHeavy` (aurora, mesh drift, blur animations) are capped at 3 simultaneous
  instances by the scheduler; beyond the cap the newest instances render their static end state.
- Blur animation is the single most expensive thing here. `blur-in` animates blur only on
  entrance, at most 12 px, and never on more than 6 elements at once.
- Every preset has a documented cost class: `cheap` / `moderate` / `heavy`. The block gallery
  shows it, and the inspector warns when a heavy preset is applied to a node with many siblings.

## Composition

A node may carry more than one spec, one per channel:

```ts
node.motion = {
  entrance: { presetId: 'fade-up', params: { distance: 24 } },
  hover:    { presetId: 'lift',    params: { distance: 4 } },
  cursor:   { presetId: 'spotlight', params: { radius: 240 } },
}
```

Rules:
- One spec per channel, maximum.
- `entrance` and `hover` compose freely — different lifecycle phases.
- `scroll` and `entrance` conflict on `transform`; the resolver picks `scroll` and warns.
- `cursor` presets only write CSS variables, so they compose with everything.
- `continuous` and `hover` compose if they touch different properties; the resolver checks and
  warns if not.

`composeMotion(specs)` is a pure function returning `{ resolved, conflicts }`. Conflicts show as
a warning chip in the motion panel with the reason.

## Codegen

Every preset emits real source. The exported component must animate identically to the canvas —
otherwise export is a demo, not a feature.

```ts
export interface MotionCodegenFragment {
  imports: ImportSpec[]                      // { from: 'motion/react', named: ['motion'] }
  hooks?: string[]                           // hook calls to place in the component body
  wrapper?: { tag: string; props: Record<string, string> }
  classNames?: string[]                      // for css-engine presets
  css?: string                               // keyframes / custom properties
  helpers?: NamedHelper[]                    // shared helper functions, deduped across the doc
}
```

`buildIR` collects fragments, dedupes helpers and keyframes by content hash, and hoists shared
transition objects to module constants. A page with eight `fade-up` sections emits **one**
`fadeUp` variant object, not eight inline literals — that is what makes the output look
hand-written.

Golden-file tests lock the emitted source for every preset. See
[EXPORT_ENGINE.md](EXPORT_ENGINE.md).

## Adding a preset

1. `packages/motion/src/presets/<id>.ts`, typed as `MotionPreset`.
2. Compose from `EASINGS` / `SPRINGS`. New curve values need a justification.
3. Write `resolve`, `resolveReduced`, `codegen`, `controls`.
4. Declare `capabilities` including the cost class.
5. Unit-test: resolution shape, reduced-motion output, codegen golden file.
6. Add a Storybook story with live controls.
7. Add the row to the catalogue table above.

A preset missing `resolveReduced` or `codegen` does not merge.
