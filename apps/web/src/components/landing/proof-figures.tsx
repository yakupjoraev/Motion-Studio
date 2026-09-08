'use client'

import { useEffect, useState } from 'react'

import { useInView } from './use-in-view'

export interface ProofFigure {
  readonly label: string
  readonly value: number
}

/**
 * The three numbers, counting to themselves when the band is reached.
 *
 * The value is in the DOM as text for a screen reader and drawn by a CSS counter for everyone else,
 * because the drawn one is the one that moves and generated content is not something to hang a fact
 * on. Without script the CSS shows the final value and this component never renders — the strip is
 * complete in the HTML the server sent.
 */
export function ProofFigures({ figures }: { readonly figures: readonly ProofFigure[] }) {
  const { ref, seen } = useInView<HTMLDListElement>(0.5)
  const [scripted, setScripted] = useState(false)

  /*
   * The attribute is absent in the server's HTML and stays absent without script, because the CSS
   * without it prints the final value. A page with no JavaScript must not show three zeroes.
   */
  useEffect(() => setScripted(true), [])

  const state = !scripted ? undefined : seen ? 'running' : 'waiting'

  return (
    <dl
      className="grid grid-cols-3 gap-x-8 gap-y-2 sm:max-w-[38rem]"
      ref={ref}
      // One attribute for the row rather than one per figure: they count together, and a
      // per-figure observer would let them drift apart by a frame.
      data-counting={state}
    >
      {figures.map((figure, index) => (
        <div className="flex flex-col gap-1" key={figure.label}>
          <dd className="font-display text-5xl tabular-nums leading-none tracking-[-0.03em]">
            <span className="sr-only">{figure.value}</span>
            <span
              aria-hidden="true"
              data-ms-count
              style={{
                ['--ms-count-to' as string]: String(figure.value),
                ['--ms-hero-delay' as string]: `${index * 90}ms`,
              }}
            />
          </dd>
          <dt className="font-mono text-2xs text-foreground-muted uppercase tracking-[0.16em]">
            {figure.label}
          </dt>
        </div>
      ))}
    </dl>
  )
}
