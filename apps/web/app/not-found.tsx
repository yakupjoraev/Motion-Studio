import Link from 'next/link'

/**
 * A 404 that behaves like the rest of the product: says what happened, where, and what to do —
 * UI_GUIDELINES.md § Copy. No apology, no illustration, and the two links a lost visitor actually
 * wants.
 *
 * It carries no document actions on purpose. Nothing has failed here: a wrong URL is not a crash,
 * and offering a crash recovery would suggest otherwise.
 */
export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col justify-center gap-4 px-6">
      <p className="text-2xs text-foreground-subtle uppercase tracking-[0.14em]">404</p>
      <h1 className="font-semibold text-2xl">That page does not exist</h1>
      <p className="text-foreground-muted text-sm">
        The address is wrong or the page has moved. The block catalogue and the studio are both
        still here.
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          className="h-9 rounded-md border border-border px-3 py-2 font-medium text-sm hover:bg-surface-2"
          href="/blocks"
        >
          Browse blocks
        </Link>
        <Link
          className="h-9 rounded-md border border-border px-3 py-2 font-medium text-sm hover:bg-surface-2"
          href="/studio"
        >
          Open the studio
        </Link>
      </div>
    </main>
  )
}
