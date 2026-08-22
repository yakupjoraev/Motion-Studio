import { describe, expect, it } from 'vitest'

import { collectImports } from '../../ir/passes/collect-imports'

import { printImport, printImports } from './print-imports'

describe('printImport', () => {
  it('prints a named clause', () => {
    expect(printImport({ from: 'motion/react', named: ['motion', 'useReducedMotion'] })).toBe(
      "import { motion, useReducedMotion } from 'motion/react'",
    )
  })

  it('prints a default clause', () => {
    expect(printImport({ from: 'next/image', default: 'Image' })).toBe(
      "import Image from 'next/image'",
    )
  })

  it('prints both in one statement', () => {
    expect(printImport({ from: 'react', default: 'React', named: ['useState'] })).toBe(
      "import React, { useState } from 'react'",
    )
  })

  it('prints a type-only import with the keyword', () => {
    expect(printImport({ from: 'react', named: ['CSSProperties'], typeOnly: true })).toBe(
      "import type { CSSProperties } from 'react'",
    )
  })

  it('prints a side-effect import when there is no clause', () => {
    expect(printImport({ from: './globals.css' })).toBe("import './globals.css'")
  })
})

describe('printImports', () => {
  /**
   * Pass 5 sorted them into groups; the blank lines are where those groups meet. Every hand-written
   * file in this repository reads that way, and matching it is the point of the whole prompt.
   */
  it('separates external, alias and relative groups with a blank line', () => {
    const printed = printImports(
      collectImports([
        { from: './lib/motion', named: ['fadeUp'] },
        { from: 'motion/react', named: ['motion'] },
        { from: '@/components/nav', named: ['Nav'] },
      ]),
    )

    expect(printed).toBe(
      "import { motion } from 'motion/react'\n\nimport { Nav } from '@/components/nav'\n\nimport { fadeUp } from './lib/motion'",
    )
  })

  it('keeps one group together', () => {
    const printed = printImports(
      collectImports([
        { from: 'next/image', default: 'Image' },
        { from: 'motion/react', named: ['motion'] },
      ]),
    )

    expect(printed.split('\n')).toHaveLength(2)
  })

  it('prints nothing for a file with no imports', () => {
    expect(printImports([])).toBe('')
  })
})
