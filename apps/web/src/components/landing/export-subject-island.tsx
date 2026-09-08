'use client'

import { type ReactNode, Suspense, lazy } from 'react'

import { useIslandMount } from './use-island-mount'

/** The block, its theme scope and the preset table all arrive with the section, not with the page. */
const Live = lazy(async () => ({ default: (await import('./export-subject')).ExportSubject }))

export interface ExportSubjectIslandProps {
  readonly fallback: ReactNode
}

export function ExportSubjectIsland({ fallback }: ExportSubjectIslandProps) {
  const { ref, mounted } = useIslandMount()

  return (
    <div ref={ref}>{mounted ? <Suspense fallback={fallback}>{<Live />}</Suspense> : fallback}</div>
  )
}
