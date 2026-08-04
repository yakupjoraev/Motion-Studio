# 17 — Canvas coordinates

**Milestone** M3 · **Depends on** 12 · **Commit** `feat(canvas): add coordinate system with branded spaces`

## Read first

- `docs/CANVAS.md` — § Coordinate spaces, § Zoom
- `docs/CODE_STANDARDS.md` — § TypeScript (branded types)

## Goal

The coordinate maths, as pure functions with branded types. Small prompt, high leverage: most canvas
bugs are a screen-vs-canvas confusion, and this is where that class of bug gets designed out.

## Deliverables

```
packages/canvas/src/coords/
├── coords.types.ts       ScreenPoint, CanvasPoint, NodePoint, ViewportTransform, Rect
├── points.ts             screenPoint(), canvasPoint(), nodePoint() constructors
├── convert.ts            screenToCanvas, canvasToScreen, screenRectToCanvas, canvasRectToScreen
├── zoom.ts               zoomAt, clampZoom, quantizeZoom, ZOOM_STEPS
├── fit.ts                fitToRect, fitToSelection (padding + max-zoom rules)
├── constants.ts          MIN_ZOOM 0.1, MAX_ZOOM 4, ZOOM_QUANTUM 0.0001
└── *.test.ts
```

## Constraints

### Branded types

```ts
declare const SPACE: unique symbol
export type ScreenPoint = { x: number; y: number; readonly [SPACE]: 'screen' }
export type CanvasPoint = { x: number; y: number; readonly [SPACE]: 'canvas' }
```

A `unique symbol` brand rather than a string-literal field, so the brand cannot be forged by
constructing an object literal. Write a type-level test proving `ScreenPoint` is not assignable to
`CanvasPoint` and vice versa.

The constructors are the only way to create one:

```ts
export function screenPoint(x: number, y: number): ScreenPoint
```

### `zoomAt`

Derived, never accumulated:

```ts
export function zoomAt(t: ViewportTransform, factor: number, anchor: ScreenPoint, rect: DOMRect): ViewportTransform
```

Compute the anchor's canvas position under the *current* transform, then solve for the pan that keeps
it at the same screen position under the *new* zoom. Do not adjust pan by a delta — that is what
causes drift.

Test: 100 alternating zoom-in/zoom-out operations at a fixed anchor. Final pan must be within 0.01 px
of the initial pan. This test is the whole reason this function is separate and pure.

### Quantisation

Zoom is quantised to `ZOOM_QUANTUM` so the displayed percentage does not flicker between 99.99998 %
and 100.00001 %. Applied inside `clampZoom`.

### `fitToRect`

- 64 px padding in screen space
- Never zooms past 200 % when fitting to a selection (fitting to a tiny node should not slam to 400 %)
- Never zooms past 100 % when fitting the whole document
- Centres the rect

### Property tests

```ts
it('screen↔canvas round-trips', () => {
  fc.assert(fc.property(arbScreenPoint(), arbTransform(), arbRect(), (p, t, rect) => {
    const back = canvasToScreen(screenToCanvas(p, t, rect), t, rect)
    expect(back.x).toBeCloseTo(p.x, 3)
    expect(back.y).toBeCloseTo(p.y, 3)
  }))
})
```

Same for rects. Generate transforms across the full zoom range including the extremes, and pans in
both signs — a sign error passes at pan `{0,0}` and fails everywhere else.

## Verify

```bash
pnpm --filter @motion-studio/canvas test --coverage
```

Required assertions:
- Round-trip property tests for points and rects, both directions
- `zoomAt` keeps the anchor stationary (single operation, exact)
- `zoomAt` drift under 0.01 px over 100 alternating operations
- `clampZoom` respects both bounds and quantises
- `fitToRect` centring, padding, and both max-zoom rules
- Type-level: the three point spaces are mutually non-assignable

```bash
pnpm lint && pnpm typecheck
```

## Done when

- [ ] `unique symbol` brands with a mutual non-assignability type test
- [ ] Conversions round-trip, proven by property tests across the full transform range
- [ ] `zoomAt` derived, drift-free over 100 operations
- [ ] Quantisation in place
- [ ] `fitToRect` obeys both max-zoom rules
- [ ] ≥ 85 % / ≥ 80 % coverage for the module
- [ ] No DOM access in any of these functions except reading the passed `DOMRect`
