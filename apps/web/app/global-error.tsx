'use client'

import { useState } from 'react'

export interface GlobalErrorProps {
  readonly error: Error & { digest?: string }
  readonly reset: () => void
}

/**
 * The last resort — `prompts/58` § `global-error.tsx`.
 *
 * This renders when the root layout itself threw, which means there is no layout, no providers, and
 * possibly no stylesheet: every import here would be a second thing that can fail while handling a
 * failure. So it imports nothing but React, styles itself inline, and reads `localStorage`
 * directly rather than through the storage module.
 *
 * It does exactly two things, and the second is the one that matters: say what happened, and get the
 * user's document out of the browser.
 */
const PENDING_KEY = 'motion-studio.pending-write'

const styles = {
  page: {
    display: 'flex',
    minHeight: '100vh',
    flexDirection: 'column',
    justifyContent: 'center',
    gap: '16px',
    margin: '0 auto',
    maxWidth: '34rem',
    padding: '0 24px',
    fontFamily: 'system-ui, sans-serif',
    color: '#111',
    background: '#fff',
  },
  heading: { fontSize: '20px', fontWeight: 600, margin: 0 },
  body: { fontSize: '14px', lineHeight: 1.5, color: '#444', margin: 0 },
  row: { display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' },
  button: {
    height: '36px',
    padding: '0 12px',
    borderRadius: '6px',
    border: '1px solid #ccc',
    background: '#fff',
    font: 'inherit',
    fontSize: '14px',
    cursor: 'pointer',
  },
  primary: {
    height: '36px',
    padding: '0 12px',
    borderRadius: '6px',
    border: '1px solid #4c1d95',
    background: '#5b21b6',
    color: '#fff',
    font: 'inherit',
    fontSize: '14px',
    cursor: 'pointer',
  },
  note: { fontSize: '12px', color: '#666', margin: 0 },
  pre: {
    maxHeight: '160px',
    overflow: 'auto',
    background: '#f5f5f5',
    padding: '8px',
    borderRadius: '4px',
    fontSize: '11px',
    whiteSpace: 'pre-wrap',
  },
} as const

/**
 * The unload lane, read by hand. `readPending` would be the right function and the wrong dependency:
 * if the module graph is what broke, importing more of it is not a recovery.
 */
const downloadPending = (): string => {
  let raw: string | null = null

  try {
    raw = window.localStorage.getItem(PENDING_KEY)
  } catch {
    return 'This browser refused access to local storage.'
  }

  if (raw === null) {
    return 'No document was found in this browser.'
  }

  try {
    const parsed = JSON.parse(raw) as { document?: { meta?: { name?: string } } }
    const name = parsed.document?.meta?.name ?? 'document'
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(parsed.document, null, 2)], { type: 'application/json' }),
    )
    const anchor = window.document.createElement('a')

    anchor.href = url
    anchor.download = `${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.motion.json`
    anchor.click()
    URL.revokeObjectURL(url)

    return 'Downloaded the last saved copy.'
  } catch {
    return 'The saved copy could not be read.'
  }
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  const [note, setNote] = useState<string | null>(null)

  return (
    <html lang="en">
      <body style={styles.page}>
        <h1 style={styles.heading}>Motion Studio could not start</h1>
        <p style={styles.body}>
          The application failed before it could render. Download the last document this browser
          saved, then reload.
        </p>

        <div style={styles.row}>
          <button onClick={() => setNote(downloadPending())} style={styles.primary} type="button">
            Download saved document
          </button>
          <button onClick={reset} style={styles.button} type="button">
            Try again
          </button>
          <button onClick={() => window.location.reload()} style={styles.button} type="button">
            Reload
          </button>
        </div>

        {note === null ? null : <p style={styles.note}>{note}</p>}

        <pre style={styles.pre}>
          {error.name}: {error.message}
          {error.digest === undefined ? '' : `\nDigest: ${error.digest}`}
        </pre>
      </body>
    </html>
  )
}
