import { CARD, DEMO, DemoFrame, START, cardClass } from './hero-demo-frame'

/**
 * The node the server renders, and what a visitor without JavaScript keeps — `prompts/51`:
 * "degrades to a static rendered node ... with a caption saying 'Interactive demo — open the studio'".
 *
 * It is also what the island shows until it mounts, so the frame never resizes and nothing shifts.
 */
export function HeroDemoStatic() {
  return (
    <DemoFrame caption="Interactive demo — open the studio">
      <div
        className={`${cardClass} border-accent bg-accent-muted text-foreground shadow-[inset_0_1px_0_color-mix(in_oklch,var(--ms-color-foreground)_16%,transparent),0_0_28px_-6px_var(--ms-color-accent)]`}
        style={{
          left: `${(START.x / DEMO.width) * 100}%`,
          top: `${(START.y / DEMO.height) * 100}%`,
          width: `${(CARD.width / DEMO.width) * 100}%`,
          height: `${(CARD.height / DEMO.height) * 100}%`,
        }}
      >
        Hero
      </div>
    </DemoFrame>
  )
}
