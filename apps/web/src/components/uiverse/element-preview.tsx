'use client'

import { type ReactElement, useEffect, useRef } from 'react'

export interface ElementPreviewProps {
  readonly html: string
  readonly css: string
  readonly styling: 'css' | 'tailwind'
}

/**
 * Generated from the catalogue by `scripts/build-uiverse-tailwind.ts`, because a shadow root sees no
 * stylesheet from the page and the app's own Tailwind build only generates the classes it finds in
 * source files — these live in JSON it never scans. One request, cached, shared by every Tailwind
 * card on the page: 470 KiB of stock Tailwind, 50 KiB over the wire.
 */
const TAILWIND = '/uiverse-tailwind.css'

/**
 * A Uiverse element, rendered in a shadow root.
 *
 * Isolation is the whole job. These elements are written as standalone pages, so their CSS selects
 * bare tags — `button { … }`, `input { … }`, and in a few cases `body` — and putting three dozen of
 * them on one page unscoped would restyle the page itself. A shadow root scopes both ways: their
 * rules cannot reach our chrome, and ours cannot reach them, so what is on screen is the element as
 * its author wrote it rather than the element wearing our tokens.
 *
 * The markup is inserted rather than parsed into React elements, because that is what it is: a
 * fragment of somebody else's HTML, kept verbatim so the attribution comment inside it survives.
 * Nothing here executes — `scripts/import-uiverse.ts` asserts the catalogue contains no `<script>`
 * at all, and a shadow root does not run one even if a later import lets one through.
 */
export function ElementPreview({ html, css, styling }: ElementPreviewProps): ReactElement {
  const host = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const node = host.current

    if (node === null) {
      return
    }

    const root = node.shadowRoot ?? node.attachShadow({ mode: 'open' })
    const stylesheet = styling === 'tailwind' ? `<link rel="stylesheet" href="${TAILWIND}">` : ''

    // `:host` gives the element room to be itself: many are written expecting a centred viewport.
    root.innerHTML = `${stylesheet}<style>:host{all:initial;display:grid;place-items:center;min-height:100%;font-family:system-ui,sans-serif}${css}</style>${html}`

    return () => {
      root.innerHTML = ''
    }
  }, [css, html, styling])

  return <div className="grid h-full w-full place-items-center overflow-hidden" ref={host} />
}
