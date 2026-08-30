import type { ReactNode } from 'react'

/** Canvas units. The demo's whole coordinate space, shared by the server frame and the island. */
export const DEMO = { width: 420, height: 300 } as const

export const CARD = { width: 132, height: 68 } as const

/** Two fixed siblings and the one the visitor moves — the smallest arrangement snapping can prove. */
export const FIXED = [
  { id: 'a', x: 40, y: 40, label: 'Navbar' },
  { id: 'b', x: 40, y: 192, label: 'Footer' },
] as const

export const START: { readonly x: number; readonly y: number } = { x: 236, y: 116 }

export interface DemoFrameProps {
  readonly children?: ReactNode
  /** Shown when there is no interaction to offer: no JavaScript, or the island has not arrived. */
  readonly caption: string
}

const cardClass =
  'absolute grid place-content-center rounded-md border border-border bg-surface-2 text-center font-mono text-2xs uppercase tracking-[0.14em] text-foreground-muted shadow-[inset_0_1px_0_color-mix(in_oklch,var(--ms-color-foreground)_8%,transparent)]'

/**
 * The frame, the dotted ground and the two fixed cards — server-rendered, so the shape of the demo
 * is in the HTML and nothing shifts when the island arrives. The island renders the moving card into
 * `children`; without it, `hero-demo-static` draws that card too.
 */
export function DemoFrame({ children, caption }: DemoFrameProps) {
  return (
    <figure className="m-0 flex flex-col gap-3">
      {/*
        Surface treatment, not decoration — DESIGN_REFERENCES.md § Why the chrome is the exception
        names it exactly: "hairline borders that catch light, the inner top highlight on dark elevated
        surfaces". The dotted ground is the canvas's own grid at its own size.
      */}
      <div
        className="relative w-full overflow-hidden rounded-xl border border-border-strong bg-surface-1 [background-image:radial-gradient(var(--ms-color-canvas-grid)_1px,transparent_1px)] [background-size:16px_16px] shadow-[inset_0_1px_0_color-mix(in_oklch,var(--ms-color-foreground)_10%,transparent),0_24px_60px_-24px_rgb(0_0_0/0.6)]"
        style={{ aspectRatio: `${DEMO.width} / ${DEMO.height}` }}
      >
        <div
          className="absolute inset-0"
          style={{
            containerType: 'inline-size',
            // One coordinate space for both halves: percentages of the same 420 × 300 box.
            ['--demo-w' as string]: String(DEMO.width),
            ['--demo-h' as string]: String(DEMO.height),
          }}
        >
          {FIXED.map((card) => (
            <div
              className={cardClass}
              key={card.id}
              style={{
                left: `${(card.x / DEMO.width) * 100}%`,
                top: `${(card.y / DEMO.height) * 100}%`,
                width: `${(CARD.width / DEMO.width) * 100}%`,
                height: `${(CARD.height / DEMO.height) * 100}%`,
              }}
            >
              {card.label}
            </div>
          ))}

          {children}
        </div>
      </div>

      {/*
        Two lines of room, always. The static caption and the live readout are different lengths, and
        at 412 px one wraps where the other does not — measured as 0.073 of the page's CLS when the
        island swapped (ADR-295). The box is reserved so neither state can resize the figure.
      */}
      <figcaption className="min-h-[2.6em] font-mono text-2xs text-foreground-muted uppercase leading-[1.3] tracking-[0.14em]">
        {caption}
      </figcaption>
    </figure>
  )
}

export { cardClass }
