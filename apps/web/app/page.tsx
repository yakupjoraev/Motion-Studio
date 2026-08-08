import Link from 'next/link'

/** A placeholder until the landing page is built. PRODUCT.md § 9 is what replaces it. */
export default function HomePage() {
  return (
    <main className="grid h-dvh place-content-center gap-4 text-center">
      <h1 className="font-display text-2xl tracking-tight">Motion Studio</h1>
      <Link className="text-accent text-sm underline underline-offset-4" href="/studio">
        Open the studio →
      </Link>
    </main>
  )
}
