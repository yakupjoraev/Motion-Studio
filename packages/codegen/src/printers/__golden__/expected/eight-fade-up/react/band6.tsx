'use client'

import { motion, useReducedMotion } from 'motion/react'

import { fadeUpTransition, fadeUpVariants } from './lib/motion'

export function Band6() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.section
      variants={fadeUpVariants}
      initial={shouldReduceMotion ? 'visible' : 'hidden'}
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      transition={shouldReduceMotion ? { duration: 0 } : fadeUpTransition}
      className="mx-auto max-w-3xl px-6 py-16 text-center"
    />
  )
}
