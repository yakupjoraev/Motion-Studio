/**
 * The pointer, drawn — `prompts/59` § `generate-demos.mjs`.
 *
 * Playwright dispatches input events without moving a real cursor, so a recording of a session it
 * drove shows things happening with nothing making them happen. This injects a follower: a ring that
 * tracks `mousemove` and pulses on `mousedown`, `pointer-events: none` so it cannot take a click it
 * is only illustrating.
 *
 * Injected through `addInitScript`, which runs before the page's own scripts on every navigation —
 * including the client-side ones, where a one-off `evaluate` would be lost.
 */
export const CURSOR_SCRIPT = `(() => {
  const SIZE = 22

  const mount = () => {
    if (document.getElementById('ms-demo-cursor') !== null) {
      return
    }

    const style = document.createElement('style')

    style.textContent = \`
      #ms-demo-cursor {
        position: fixed;
        top: 0;
        left: 0;
        width: \${SIZE}px;
        height: \${SIZE}px;
        margin: -\${SIZE / 2}px 0 0 -\${SIZE / 2}px;
        border-radius: 999px;
        border: 2px solid rgba(255, 255, 255, 0.92);
        box-shadow: 0 0 0 1.5px rgba(0, 0, 0, 0.45), 0 2px 10px rgba(0, 0, 0, 0.35);
        background: rgba(255, 255, 255, 0.16);
        pointer-events: none;
        z-index: 2147483647;
        transform: translate3d(-100px, -100px, 0);
        transition: transform 90ms linear, width 120ms ease, height 120ms ease, background 120ms ease;
      }
      #ms-demo-cursor[data-pressed='true'] {
        width: \${SIZE - 8}px;
        height: \${SIZE - 8}px;
        margin: -\${(SIZE - 8) / 2}px 0 0 -\${(SIZE - 8) / 2}px;
        background: rgba(255, 255, 255, 0.55);
      }
      /* The studio's own cursor stays visible in the recording as the hotspot; the ring is the halo. */
    \`

    const dot = document.createElement('div')

    dot.id = 'ms-demo-cursor'
    document.documentElement.append(style, dot)

    const place = (event) => {
      dot.style.transform = \`translate3d(\${event.clientX}px, \${event.clientY}px, 0)\`
    }

    window.addEventListener('mousemove', place, true)
    window.addEventListener('mousedown', (event) => {
      place(event)
      dot.dataset.pressed = 'true'
    }, true)
    window.addEventListener('mouseup', () => {
      dot.dataset.pressed = 'false'
    }, true)
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount, { once: true })
  } else {
    mount()
  }
})()`
