import { vi } from 'vitest'

/**
 * jsdom ships no `PointerEvent`, and without one Testing Library sends a bare `Event` whose
 * coordinates dnd-kit cannot read. `isPrimary` matters too: the pointer sensor refuses to activate
 * on a non-primary pointer.
 */
export class PointerEventStub extends MouseEvent {
  readonly pointerId: number
  readonly isPrimary: boolean

  constructor(type: string, init: PointerEventInit = {}) {
    super(type, init)
    this.pointerId = init.pointerId ?? 1
    this.isPrimary = init.isPrimary ?? true
  }
}

export function stubPointerEvents(): void {
  vi.stubGlobal('PointerEvent', PointerEventStub)
}
