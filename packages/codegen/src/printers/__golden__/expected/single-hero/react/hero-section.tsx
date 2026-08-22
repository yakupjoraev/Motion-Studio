'use client'

import { motion, useReducedMotion } from 'motion/react'

const fadeUpTransition = {
  duration: 0.6,
  ease: [0.16, 1, 0.3, 1],
}

const fadeUpVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
}

export function HeroSection() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.section
      variants={fadeUpVariants}
      initial={shouldReduceMotion ? 'visible' : 'hidden'}
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      transition={shouldReduceMotion ? { duration: 0 } : fadeUpTransition}
      className="mx-auto max-w-3xl px-8 py-24 text-center"
    />
  )
}
