# 18 — Viewport: pan and zoom

**Milestone** M3 · **Depends on** 17 · **Commit** `feat(canvas): add pan and zoom with transient transform`

## Read first

- `docs/CANVAS.md` — § DOM structure, § Pan, § Zoom, § Grid
- `docs/PERFORMANCE.md` — § The core rule, § Canvas specifics
- `docs/STATE_MANAGEMENT.md` — § Transient state
- `docs/SHORTCUTS.md` — § Viewport

## Goal

A pannable, zoomable infinite canvas where **pan and zoom never re-render React**. The scene
transform is a CSS variable write inside a `rAF` loop; the store learns the value once, on gesture
end.

## Deliverables

```
packages/canvas/src/
├── canvas.tsx                  the root component; takes renderNode + rootId
├── viewport/
│   ├── use-viewport.ts         the transform ref + rAF scheduler + CSS variable writes
│   ├── use-pan.ts              space-drag, middle-mouse, trackpad, momentum
│   ├── use-zoom.ts             ctrl+wheel, pinch, keyboard steps, fit
│   ├── viewport-context.tsx    provides the transform ref to overlays
│   └── *.test.ts
├── scene/
│   ├── scene.tsx               the transformed element
│   ├── artboard.tsx            breakpoint-width frame
│   └── grid.tsx                CSS background-image dots
├── canvas.styles.ts
└── index.ts
```

## Constraints

### The transform lives in a ref

```ts
const transformRef = useRef<ViewportTransform>({ zoom: 1, pan: { x: 0, y: 0 } })

function scheduleFrame() {
  if (frameRef.current !== null) return
  frameRef.current = requestAnimationFrame(() => {
    frameRef.current = null
    const { zoom, pan } = transformRef.current
    const el = sceneRef.current
    if (!el) return
    el.style.setProperty('--ms-vp-x', `${pan.x}px`)
    el.style.setProperty('--ms-vp-y', `${pan.y}px`)
    el.style.setProperty('--ms-vp-zoom', String(zoom))
  })
}
```

The scene's transform reads those variables in CSS. React is not involved. `scheduleFrame` coalesces
— multiple events in one frame produce one write.

On gesture end, commit to the store with `setPan`/`setZoom`. The store value is what the zoom
dropdown displays and what persists; the ref is what renders.

### Pan

- `movementX/Y` divided by zoom, accumulated into the ref. Not start-point tracking — `movement*`
  survives pointer capture loss and does not accumulate error.
- `setPointerCapture` on pointerdown; released on pointerup and on `lostpointercapture`.
- `Space`-hold pan mode: `keydown` sets a mode flag and the cursor; `keyup` clears it. **Also clear
  on `window.blur`** — otherwise the studio gets stuck in pan mode when the user alt-tabs mid-hold,
  which is a real bug in shipped design tools.
- Trackpad two-finger pan is a `wheel` event without `ctrlKey`; handle it separately from zoom.
- Momentum: on release above a velocity threshold, decay `v *= 0.92` per frame until under 0.1
  px/frame. Disabled under reduced motion.

### Zoom

- `ctrl/metaKey + wheel` → `zoomAt` with the cursor as anchor. Clamp the per-event factor so a
  high-resolution trackpad does not jump three steps in one event.
- Pinch arrives as `wheel` with `ctrlKey` — same path, no separate handler.
- Keyboard steps use `ZOOM_STEPS`, anchored at the viewport centre.
- `Cmd+0`, `Shift+1`, `Shift+2` per `SHORTCUTS.md`.
- `preventDefault` on zoom wheels only, and say why in a comment (otherwise the page zooms).

### Grid

Two `radial-gradient`s as a `background-image` on the artboard, sized in canvas units so it scales
with the scene. Opacity fades between 50 % and 25 % zoom via a CSS variable set alongside the
transform; hidden below 25 %. Zero elements, zero render cost.

### Canvas API

```tsx
export interface CanvasProps {
  rootId: NodeId
  renderNode: (id: NodeId) => ReactNode
  artboardWidth: number
  className?: string
}
```

`packages/canvas` does **not** import `editor` or `blocks`. It receives a render function and a root
id. `check-deps` enforces it.

## Verify

```bash
pnpm --filter @motion-studio/canvas test
pnpm dev    # /studio with a temporary set of coloured placeholder divs as nodes
```

Unit tests (the pure parts):
- `use-viewport`'s frame scheduler coalesces multiple updates into one write
- Pan accumulation divides by zoom correctly
- Momentum decay terminates

Manual, in the browser, and report each:
- Pan with space-drag, middle-mouse, and trackpad — all smooth
- Hold space, alt-tab away, come back → **not** stuck in pan mode
- Zoom at cursor: the point under the cursor stays under the cursor
- Zoom in and out 20 times → the view returns to where it started
- `Cmd+0`, `Shift+1`, `Shift+2` all correct
- Grid scales with zoom and fades out below 50 %
- Page does not zoom when the canvas does

Performance, with 200 placeholder divs on the canvas:
- Add a temporary render counter on the canvas root. Pan for five seconds. **Counter must not
  increment.** Report the number.
- Open the Performance panel with 4× CPU throttle, pan for five seconds, and report the long-task
  count and whether frames held at ~16 ms.
- Then remove the counter.

## Done when

- [ ] Pan and zoom drive CSS variables through one coalesced `rAF`; zero React renders during a
      gesture, verified with a counter
- [ ] Space-pan releases on window blur
- [ ] Zoom anchors at the cursor with no drift over 20 round trips
- [ ] All viewport shortcuts working
- [ ] Grid is CSS-only and fades correctly
- [ ] 200 nodes pan at 60 fps under 4× throttle; numbers reported
- [ ] `canvas` does not depend on `editor` or `blocks`
- [ ] Verification clean
