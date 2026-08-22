'use client'

import { motion, useReducedMotion } from 'motion/react'

import { PlanCard } from './plan-card'

const fadeUpTransition = {
  duration: 0.6,
  ease: [0.16, 1, 0.3, 1],
}

const fadeUpVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: { opacity: 1, y: 0 },
}

export function Pricing() {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.div
      variants={fadeUpVariants}
      initial={shouldReduceMotion ? 'visible' : 'hidden'}
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      transition={shouldReduceMotion ? { duration: 0 } : fadeUpTransition}
      className="grid grid-cols-3 gap-8"
    >
      <PlanCard plan="Starter" price={0} />
      <PlanCard plan="Pro" price={29} />
      <PlanCard plan="Team" price={79} />
    </motion.div>
  )
}
