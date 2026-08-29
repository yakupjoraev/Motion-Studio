import type { ReactElement } from 'react'

/**
 * What stands where CodeMirror will be — PERFORMANCE.md § Mandatory dynamic imports. The editor is
 * ~110 kB that arrives after the first paint, and a placeholder of a different height would move the
 * page under the reader when it does.
 *
 * It shows the value rather than a grey box. Two reasons, and the second is measured: the value is the
 * thing the reader came to read, and a skeleton with text in it is what the browser reports as the
 * largest contentful paint — 1.2 s instead of the 3.6 s an empty box waited for the editor to fill.
 *
 * The height is a shared constant rather than two matching numbers, which is what makes "no layout
 * shift" checkable — `playground.test.tsx` asserts it.
 */
export const EDITOR_HEIGHT = 232

export interface EditorSkeletonProps {
  readonly value?: string
}

export function EditorSkeleton({ value = '' }: EditorSkeletonProps): ReactElement {
  return (
    <pre
      data-testid="editor-skeleton"
      aria-hidden="true"
      style={{ height: EDITOR_HEIGHT }}
      className="m-0 w-full overflow-hidden rounded-md border border-border bg-surface-1 px-[38px] py-1 font-mono text-foreground text-sm leading-[1.6]"
    >
      {value}
    </pre>
  )
}
