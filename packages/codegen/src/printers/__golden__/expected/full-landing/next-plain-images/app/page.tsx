import type { CSSProperties } from 'react'

import { HeroSection } from '@/components/hero-section'
import { Nav } from '@/components/nav'
import { Pricing } from '@/components/pricing'
import { ThemeToggle } from '@/components/theme-toggle'

export default function Page() {
  return (
    <main className="flex flex-col">
      <Nav />
      <HeroSection />
      <Pricing />
      <section
        className="relative isolate overflow-hidden px-6 py-16 lg:px-8 lg:py-24"
        style={{ backgroundColor: 'oklch(22% 0.02 285)' } as CSSProperties}
      >
        <img
          src="/asset_1nj8vp4.png"
          alt="The studio canvas"
          width={1600}
          height={1000}
          loading="lazy"
          decoding="async"
          className="w-full rounded-lg object-cover"
        />
      </section>
      {/* Answers are plain text; wire them to your CMS. */}
      <section className="flex flex-col gap-2">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: '{"@context":"https://schema.org","@type":"FAQPage","mainEntity":[]}',
          }}
        />
      </section>
      <ThemeToggle />
    </main>
  )
}
