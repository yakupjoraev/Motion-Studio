import Image from 'next/image'
import type { CSSProperties } from 'react'

import { HeroSection } from './hero-section'
import { Nav } from './nav'
import { Pricing } from './pricing'
import { ThemeToggle } from './theme-toggle'

export function Page() {
  return (
    <main className="flex flex-col">
      <Nav />
      <HeroSection />
      <Pricing />
      <section
        className="relative isolate overflow-hidden px-6 py-16 v-section-tint lg:px-8 lg:py-24"
        style={{ '--ms-section-tint': 'oklch(22% 0.02 285)' } as CSSProperties}
      >
        <Image
          src="https://cdn.example.com/studio.png"
          alt="The studio canvas"
          width={1600}
          height={1000}
          sizes="100vw"
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
