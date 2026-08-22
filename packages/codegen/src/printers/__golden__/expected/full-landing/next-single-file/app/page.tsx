'use client'

import { motion, useReducedMotion } from 'motion/react'
import Image from 'next/image'
import type { CSSProperties } from 'react'

const fadeUpTransition = {
  duration: 0.6,
  ease: [0.16, 1, 0.3, 1],
}

const fadeUpVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
}

export default function Page() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <main className="flex flex-col">
      <nav className="flex items-center gap-4" />
      <motion.section
        variants={fadeUpVariants}
        initial={shouldReduceMotion ? 'visible' : 'hidden'}
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        transition={shouldReduceMotion ? { duration: 0 } : fadeUpTransition}
        className="mx-auto ms-shine max-w-3xl px-8 py-24 text-center"
      />
      <motion.div
        variants={fadeUpVariants}
        initial={shouldReduceMotion ? 'visible' : 'hidden'}
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
        transition={shouldReduceMotion ? { duration: 0 } : fadeUpTransition}
        className="grid grid-cols-3 gap-8"
      >
        <article className="rounded-xl border bg-surface-1 p-6" />
        <article className="rounded-xl border bg-surface-1 p-6" />
        <article className="rounded-xl border bg-surface-1 p-6" />
      </motion.div>
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
      <button className="inline-flex size-8 rounded-md" />
    </main>
  )
}
