'use client'

import { SearchIcon } from '@motion-studio/icons'
import { Suspense, lazy, useEffect, useState } from 'react'

import { useDocs } from '../../lib/i18n/surfaces'

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
  const docs = useDocs()
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
      {/*
        Two shapes, not one shape scaled — ADR-377. Below `sm` this is a square icon button with a
        44 px touch target and no words: at 320 px the word and the shortcut together were 3 px wider
        than the viewport, and a phone has neither a ⌘ key nor room for a label it does not need. From
        `sm` up, where a keyboard is likely and the space is there, the label and the shortcut return.
      */}
      <button
        aria-label={docs.searchTrigger}
        className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-surface-1 text-foreground-muted outline-none transition-colors hover:border-border-strong hover:text-foreground focus-visible:shadow-focus sm:h-8 sm:w-auto sm:gap-2 sm:px-2.5"
        data-testid="docs-search-trigger"
        onClick={() => setOpen(true)}
        type="button"
      >
        <SearchIcon aria-hidden="true" className="size-4 sm:hidden" />
        <span className="hidden text-xs sm:inline">{docs.searchTrigger}</span>
        <kbd className="hidden rounded-[3px] border border-border-subtle bg-surface-2 px-1 font-mono text-[10px] text-foreground-muted sm:inline-block">
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
