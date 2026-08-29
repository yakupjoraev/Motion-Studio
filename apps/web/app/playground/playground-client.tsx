'use client'

import { PlaygroundLayout } from '../../src/components/playground/playground-layout'

/**
 * The client boundary, and nothing else. The layout owns the state; this file exists so the page above
 * it can stay a Server Component — ARCHITECTURE.md § Rendering strategy.
 */
export function PlaygroundClient() {
  return <PlaygroundLayout />
}
