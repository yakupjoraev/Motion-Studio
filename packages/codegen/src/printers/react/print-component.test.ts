import { describe, expect, it } from 'vitest'

import type { IRComponent } from '../../ir/ir.types'
import { resolveOptions } from '../../options.types'

import { USE_CLIENT, printComponent } from './print-component'

const component = (overrides: Partial<IRComponent> = {}): IRComponent => ({
  name: 'HeroSection',
  fileName: 'hero-section.tsx',
  props: [],
  imports: [],
  hoisted: [],
  hooks: [],
  client: { emit: false, reason: 'Nothing in this component holds state or calls a hook.' },
  root: { kind: 'element', tag: 'section', classNames: [], attributes: {}, children: [] },
  usedClasses: [],
  ...overrides,
})

const print = (
  overrides: Partial<IRComponent> = {},
  extra: Partial<Parameters<typeof printComponent>[0]> = {},
) =>
  printComponent({
    component: component(overrides),
    options: resolveOptions(),
    references: [],
    exportKind: 'named',
    ...extra,
  })

describe("the 'use client' directive", () => {
  it('is absent when the IR says nothing holds state', () => {
    expect(print().startsWith(USE_CLIENT)).toBe(false)
  })

  it('is the first line when the IR says it is needed', () => {
    const printed = print({ client: { emit: true, reason: 'The menu opens and closes.' } })

    expect(printed.split('\n')[0]).toBe(USE_CLIENT)
    expect(printed.split('\n')[1]).toBe('')
  })

  /** The reason is for the export report, not the file: the doc's example carries no comment. */
  it('does not print the reason as a comment', () => {
    expect(print({ client: { emit: true, reason: 'The menu opens and closes.' } })).not.toContain(
      'The menu opens and closes',
    )
  })
})

describe('the export', () => {
  it('is named, which is the codebase convention and what tree-shakes', () => {
    expect(print()).toContain('export function HeroSection() {')
  })

  it('is default only where Next requires it', () => {
    expect(print({ name: 'Page' }, { exportKind: 'default' })).toContain(
      'export default function Page() {',
    )
  })
})

describe('the body', () => {
  it('puts each hook above the return, separated by a blank line', () => {
    const printed = print({ hooks: ['const shouldReduceMotion = useReducedMotion()'] })

    expect(printed).toContain(
      'export function HeroSection() {\n  const shouldReduceMotion = useReducedMotion()\n\n  return (',
    )
  })

  it('goes straight to the return when there are no hooks', () => {
    expect(print()).toContain(
      'export function HeroSection() {\n  return (\n    <section />\n  )\n}',
    )
  })

  /** A JSX comment cannot sit outside an element, so the root's notes are line comments. */
  it('prints the root notes as line comments inside the return', () => {
    const printed = print({
      root: {
        kind: 'element',
        tag: 'section',
        classNames: [],
        attributes: {},
        children: [],
        notes: ['The submit handler is a no-op; wire it to your endpoint.'],
      },
    })

    expect(printed).toContain(
      '  return (\n    // The submit handler is a no-op; wire it to your endpoint.\n    <section />',
    )
  })
})

describe('imports', () => {
  it('merges the component references with what the IR collected', () => {
    const printed = print(
      { imports: [{ from: 'motion/react', named: ['motion'] }] },
      { references: [{ from: './nav', named: ['Nav'] }] },
    )

    expect(printed).toContain(
      "import { motion } from 'motion/react'\n\nimport { Nav } from './nav'",
    )
  })

  /** ADR-233. The cast is React's price for a custom property, and only the elements that need it pay. */
  it('adds the CSSProperties type import exactly when an element carries custom properties', () => {
    const plain = print()
    const styled = print({
      root: {
        kind: 'element',
        tag: 'section',
        classNames: [],
        attributes: {},
        children: [],
        cssVars: { '--ms-tint': 'oklch(22% 0.02 285)' },
      },
    })

    expect(plain).not.toContain('CSSProperties')
    expect(styled).toContain("import type { CSSProperties } from 'react'")
    expect(styled).toContain('as CSSProperties}')
  })

  it('takes no React type import in a JavaScript export, which has no types', () => {
    const printed = printComponent({
      component: component({
        root: {
          kind: 'element',
          tag: 'section',
          classNames: [],
          attributes: {},
          children: [],
          cssVars: { '--ms-tint': 'oklch(22% 0.02 285)' },
        },
      }),
      options: resolveOptions({ language: 'js' }),
      references: [],
      exportKind: 'named',
    })

    expect(printed).not.toContain("from 'react'")
  })
})

describe('hoisted constants', () => {
  it('sit above the component, never inline in the JSX', () => {
    const printed = print({
      hoisted: [{ name: 'fadeUp', code: 'const fadeUp = { hidden: { opacity: 0 } }' }],
    })

    expect(printed).toContain('const fadeUp = { hidden: { opacity: 0 } }\n\nexport function')
  })
})

describe('props', () => {
  it('prints the interface above the component and destructures with defaults', () => {
    const printed = print({
      name: 'PlanCard',
      props: [
        { name: 'plan', type: 'string', defaultValue: { kind: 'literal', value: 'Pro' } },
        { name: 'price', type: 'number', defaultValue: { kind: 'literal', value: 29 } },
      ],
    })

    expect(printed).toContain(
      'export interface PlanCardProps {\n  plan?: string\n  price?: number\n}',
    )
    expect(printed).toContain(
      "export function PlanCard({ plan = 'Pro', price = 29 }: PlanCardProps) {",
    )
  })
})

describe('the file', () => {
  it('ends with exactly one newline', () => {
    const printed = print()

    expect(printed.endsWith('}\n')).toBe(true)
    expect(printed.endsWith('}\n\n')).toBe(false)
  })
})
