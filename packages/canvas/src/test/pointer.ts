import { vi } from 'vitest'

/**
 * jsdom ships no `PointerEvent`; without this, Testing Library sends a bare `Event`. It also leaves
 * `movementX/Y` off `MouseEvent`, and those are what the pan is measured with — CANVAS.md § Pan.
 */
export class PointerEventStub extends MouseEvent {
  readonly pointerId: number
  override readonly movementX: number
  override readonly movementY: number

  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init)
    this.pointerId = init.pointerId ?? 0
    this.movementX = init.movementX ?? 0
    this.movementY = init.movementY ?? 0
  }
}

/** Pointer capture is how a pan survives the cursor leaving the canvas, and jsdom has none of it. */
export function stubPointerCapture(): void {
  Element.prototype.setPointerCapture = vi.fn()
  Element.prototype.releasePointerCapture = vi.fn()
  Element.prototype.hasPointerCapture = vi.fn(() => true)
}

/** What every gesture test in this package needs before its first event. */
export function stubGestureEnvironment(): void {
  vi.stubGlobal('PointerEvent', PointerEventStub)
  stubPointerCapture()
}

/**
 * `--ms-reduced-motion` is resolved by the cascade in a browser; jsdom does not resolve custom
 * properties at all, so the read is stubbed at the DOM API rather than in our own module.
 */
export function stubReducedMotion(reduced: boolean): void {
  const real = window.getComputedStyle.bind(window)

  vi.spyOn(window, 'getComputedStyle').mockImplementation((element, pseudo) => {
    const style = real(element, pseudo ?? undefined)

    return {
      ...style,
      getPropertyValue: (property: string) =>
        property === '--ms-reduced-motion'
          ? reduced
            ? '0'
            : '1'
          : style.getPropertyValue(property),
    } as CSSStyleDeclaration
  })
}
