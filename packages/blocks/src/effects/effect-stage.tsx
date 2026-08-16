import type { ReactNode } from 'react'

/**
 * What an effect is shown on. Every effect story renders over the same surface and the same real
 * text, because the two failures this category is prone to — an invisible effect and an unreadable
 * paragraph — are both invisible on an empty stage.
 *
 * It is also what the thumbnail generator captures, so the palette card shows the effect doing its
 * job rather than a coloured rectangle.
 */
export function EffectStage({ children }: { readonly children: ReactNode }) {
  return (
    <div className="relative isolate min-h-[320px] overflow-hidden bg-surface-0 p-10">
      {children}
      <div className="relative z-10 mx-auto flex max-w-md flex-col gap-3">
        <h2 className="font-semibold text-2xl text-foreground">Ship the launch plan</h2>
        <p className="text-foreground-muted text-sm">
          Body copy at the size a paragraph actually uses, so the effect is judged against text
          rather than against an empty surface. If this is hard to read, the effect is wrong.
        </p>
      </div>
    </div>
  )
}
