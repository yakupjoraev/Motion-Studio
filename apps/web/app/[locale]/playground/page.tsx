import type { Metadata } from 'next'

import { PlaygroundClient } from './playground-client'

export const metadata: Metadata = {
  title: 'Playground · Motion Studio',
  description: 'A live CSS laboratory: write a value, see it applied on a target built for it.',
}

/**
 * A Server Component, like the studio's: the chrome and the heading are in the HTML the server sends,
 * so the first paint is layout rather than a spinner — UI_GUIDELINES.md § Loading and empty states.
 */
export default function PlaygroundPage() {
  return (
    <main id="main" className="flex h-dvh flex-col bg-surface-0">
      <header className="flex shrink-0 items-baseline gap-3 border-border border-b px-4 py-3">
        <h1 className="m-0 font-semibold text-foreground text-md">Playground</h1>
        <p className="m-0 text-foreground-subtle text-xs">
          Eight CSS properties, each with a target built for it.
        </p>
      </header>
      <div className="min-h-0 flex-1">
        <PlaygroundClient />
      </div>
    </main>
  )
}
