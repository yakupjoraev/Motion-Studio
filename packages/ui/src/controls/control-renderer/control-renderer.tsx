import { type ReactElement, Suspense, lazy, memo } from 'react'

import type { ControlRendererProps } from './control-renderer.types'

/**
 * The switch itself is a chunk: it names every control kind, so importing it eagerly would put the
 * whole control library in the panel's first load — PERFORMANCE.md § Bundle, and the contract's
 * 250 kB budget for `/studio`. A studio with nothing selected renders no control and downloads none.
 *
 * It lives in `packages/ui` and takes nothing store-shaped, because the studio's inspector and the
 * public block gallery (prompt 52) render the same metadata from different state — one dispatches
 * commands, the other writes local state and the URL.
 */
const ControlFields = lazy(() =>
  import('./control-fields').then((module) => ({ default: module.ControlFields })),
)

function ControlRendererImpl(props: ControlRendererProps): ReactElement {
  return (
    <Suspense fallback={<span className="h-7 w-full rounded-xs bg-surface-2" />}>
      <ControlFields {...props} />
    </Suspense>
  )
}

/**
 * Memoised on the descriptor and the value: an inspector with twenty rows re-renders the one row
 * whose value moved, which is what makes a scrub drag cost one control rather than a panel.
 */
export const ControlRenderer = memo(ControlRendererImpl)
