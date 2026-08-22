'use client'

import { motion, useReducedMotion } from 'motion/react'

import { fadeUpTransition, fadeUpVariants } from '@/lib/motion'

export function HeroSection() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.section
      variants={fadeUpVariants}
      initial={shouldReduceMotion ? 'visible' : 'hidden'}
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      transition={shouldReduceMotion ? { duration: 0 } : fadeUpTransition}
      className="mx-auto ms-shine max-w-3xl px-8 py-24 text-center"
    />
  )
}
