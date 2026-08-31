'use client'

import { Suspense, lazy, useEffect, useState } from 'react'

/**
 * `React.lazy` and not `next/dynamic`: with `ssr: false` the dynamic wrapper renders `null` while its
 * chunk loads, so the first `⌘K` opens nothing (ADR-295). Suspense renders the fallback instead.
 *
 * The chunk carries the dialog, the combobox and the index fetch. A reader who never searches
 * downloads none of it.
 */
const DocsSearchDialog = lazy(async () => ({
  default: (await import('./docs-search-dialog')).DocsSearchDialog,
}))

export function DocsSearch() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key.toLowerCase() === 'k' && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        setOpen(true)
      }
    }

    window.addEventListener('keydown', onKeyDown)

    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <>
      <button
        className="flex h-8 items-center gap-2 rounded-md border border-border bg-surface-1 px-2.5 text-foreground-muted outline-none transition-colors hover:border-border-strong hover:text-foreground focus-visible:shadow-focus"
        data-testid="docs-search-trigger"
        onClick={() => setOpen(true)}
        type="button"
      >
        <span className="text-xs">Search</span>
        <kbd className="rounded-[3px] border border-border-subtle bg-surface-2 px-1 font-mono text-[10px] text-foreground-muted">
          ⌘K
        </kbd>
      </button>

      {open ? (
        <Suspense fallback={null}>
          <DocsSearchDialog onClose={() => setOpen(false)} />
        </Suspense>
      ) : null}
    </>
  )
}
