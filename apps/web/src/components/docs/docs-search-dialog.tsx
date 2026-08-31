'use client'

import { Dialog } from '@motion-studio/ui'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import type { SearchIndex } from '../../lib/docs/build-search-index'
import { slugify } from '../../lib/docs/headings'
import { PaletteCombobox } from '../palette/palette-combobox'
import { fuzzyScore } from '../studio/command-palette/fuzzy-match'

const LIST_HEIGHT = 320
const LIMIT = 40

export const INDEX_URL = '/docs-search-index.json'

interface Hit {
  readonly id: string
  readonly href: string
  readonly doc: string
  readonly heading: string | null
  readonly snippet: string
  readonly label: string
  readonly keywords: readonly string[]
}

function hitsOf(index: SearchIndex): readonly Hit[] {
  const docs = index.docs.map((doc) => ({
    id: doc.file,
    href: doc.href,
    doc: doc.file,
    heading: null,
    snippet: doc.snippet,
    label: doc.file,
    keywords: [doc.title, doc.summary, doc.snippet],
  }))

  const sections = index.sections.flatMap((section) => {
    const doc = index.docs[section.doc]

    if (doc === undefined) {
      return []
    }

    const slug = section.slug ?? slugify(section.text)

    return [
      {
        id: `${doc.file}#${slug}`,
        href: `${doc.href}#${slug}`,
        doc: doc.file,
        heading: section.text,
        // A section's own heading is the content; repeating the document's first paragraph under
        // every one of its sections filled the list with the same sentence four times over.
        snippet: '',
        label: section.text,
        keywords: [doc.file],
      },
    ]
  })

  return [...docs, ...sections]
}

export interface DocsSearchDialogProps {
  readonly onClose: () => void
}

/**
 * `⌘K` within the docs. The index is fetched here rather than imported, so it is downloaded on the
 * first open and never by a reader who does not search — prompt 53 § Performance.
 */
export function DocsSearchDialog({ onClose }: DocsSearchDialogProps) {
  const router = useRouter()
  const [index, setIndex] = useState<SearchIndex | null>(null)
  const [failed, setFailed] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)

  useEffect(() => {
    let live = true

    fetch(INDEX_URL)
      .then((response) => (response.ok ? response.json() : Promise.reject(new Error('no index'))))
      .then((payload: SearchIndex) => {
        if (live) {
          setIndex(payload)
        }
      })
      .catch(() => {
        if (live) {
          setFailed(true)
        }
      })

    return () => {
      live = false
    }
  }, [])

  const hits = useMemo(() => (index === null ? [] : hitsOf(index)), [index])

  const matches = useMemo(() => {
    // An empty query lists the documents; 625 rows of every section is not a starting point.
    if (query.trim() === '') {
      return hits.filter((hit) => hit.heading === null)
    }

    const scored: { hit: Hit; score: number }[] = []

    for (const hit of hits) {
      const score = fuzzyScore({ label: hit.label, keywords: hit.keywords }, query)

      if (score !== null) {
        scored.push({ hit, score })
      }
    }

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, LIMIT)
      .map((entry) => entry.hit)
  }, [hits, query])

  const pick = (index_: number): void => {
    const hit = matches[index_]

    if (hit === undefined) {
      return
    }

    onClose()
    router.push(hit.href)
  }

  const activeHit = matches[active]

  return (
    <Dialog
      description="Search every document and every section by name."
      onOpenChange={(open) => {
        if (!open) {
          onClose()
        }
      }}
      open
      size="lg"
      title="Search the documentation"
    >
      <PaletteCombobox
        active={active}
        activeOptionId={activeHit === undefined ? undefined : `docs-hit-${activeHit.id}`}
        count={matches.length}
        empty={
          <p className="p-4 text-center text-foreground-muted text-xs">
            {failed
              ? 'The search index did not load. Every document is still in the sidebar.'
              : index === null
                ? 'Loading the index…'
                : `Nothing matches “${query}”.`}
          </p>
        }
        inputLabel="Search the documentation"
        inputTestId="docs-search-input"
        listHeight={LIST_HEIGHT}
        listId="docs-search-listbox"
        listLabel="Documentation"
        listTestId="docs-search-listbox"
        onPick={pick}
        placeholder="Type a document or a section…"
        query={query}
        setActive={setActive}
        setQuery={(value) => {
          setQuery(value)
          setActive(0)
        }}
      >
        {matches.map((hit, position) => (
          // biome-ignore lint/a11y/useKeyWithClickEvents: the listbox owns the keyboard; an option inside it is not a tab stop
          // biome-ignore lint/a11y/useFocusableInteractive: aria-activedescendant keeps focus on the input
          <div
            aria-posinset={position + 1}
            aria-selected={position === active}
            aria-setsize={matches.length}
            className={`flex cursor-default flex-col gap-0.5 px-3 py-1.5 ${
              position === active ? 'bg-accent-muted text-foreground' : 'text-foreground-muted'
            }`}
            data-testid="docs-search-option"
            id={`docs-hit-${hit.id}`}
            key={hit.id}
            onClick={() => pick(position)}
            // biome-ignore lint/a11y/useSemanticElements: an <option> cannot carry a document column beside the match
            role="option"
          >
            <span className="flex items-baseline gap-2">
              <span className="shrink-0 font-mono text-[10px] text-foreground-muted uppercase tracking-wide">
                {hit.doc.replace(/\.md$/, '')}
              </span>
              <span className="truncate text-xs">{hit.heading ?? hit.snippet}</span>
            </span>
          </div>
        ))}
      </PaletteCombobox>
    </Dialog>
  )
}
