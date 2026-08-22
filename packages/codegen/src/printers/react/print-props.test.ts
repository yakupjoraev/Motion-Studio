import { describe, expect, it } from 'vitest'

import type { IRProp } from '../../ir/ir.types'
import { resolveOptions } from '../../options.types'

import {
  defaultOfProp,
  printPropsInterface,
  printPropsParameter,
  propsTypeName,
  tsType,
  typeOfProp,
} from './print-props'

const prop = (overrides: Partial<IRProp> & Pick<IRProp, 'name'>): IRProp => ({
  type: 'string',
  defaultValue: { kind: 'literal', value: '' },
  ...overrides,
})

const TS = resolveOptions()
const JS = resolveOptions({ language: 'js' })

describe('tsType', () => {
  it('names the primitives', () => {
    expect(tsType('a')).toBe('string')
    expect(tsType(3)).toBe('number')
    expect(tsType(true)).toBe('boolean')
    expect(tsType(null)).toBe('null')
  })

  it('reads an array through its members', () => {
    expect(tsType(['Product', 'Pricing'])).toBe('string[]')
    expect(tsType([])).toBe('unknown[]')
    expect(tsType([1, 'a'])).toBe('(number | string)[]')
  })

  it('reads an object structurally, so the component is callable', () => {
    expect(tsType([{ q: 'Is it free?', a: 'The editor is.' }])).toBe('{ q: string; a: string }[]')
    expect(tsType({})).toBe('Record<string, unknown>')
  })

  it('quotes a key that is not an identifier', () => {
    expect(tsType({ 'data-id': 1 })).toBe("{ 'data-id': number }")
  })

  it('falls back to unknown for a value JSON cannot describe', () => {
    expect(tsType(undefined)).toBe('unknown')
  })
})

describe('typeOfProp', () => {
  it('takes the declared type when the IR knows it', () => {
    expect(typeOfProp(prop({ name: 'price', type: 'number' }))).toBe('number')
  })

  it('derives a json prop from the value the document held', () => {
    const items = prop({
      name: 'items',
      type: 'json',
      defaultValue: { kind: 'expression', code: '[{"q":"a","a":"b"}]' },
    })

    expect(typeOfProp(items)).toBe('{ q: string; a: string }[]')
  })

  it('says unknown rather than throwing on a value that is not JSON', () => {
    const broken = prop({
      name: 'x',
      type: 'json',
      defaultValue: { kind: 'expression', code: '{' },
    })

    expect(typeOfProp(broken)).toBe('unknown')
  })
})

describe('defaultOfProp', () => {
  it('prints each value kind the way the parameter list needs it', () => {
    expect(
      defaultOfProp(prop({ name: 'a', defaultValue: { kind: 'literal', value: "it's" } })),
    ).toBe("'it\\'s'")
    expect(defaultOfProp(prop({ name: 'a', defaultValue: { kind: 'literal', value: 29 } }))).toBe(
      '29',
    )
    expect(
      defaultOfProp(prop({ name: 'a', defaultValue: { kind: 'expression', code: '[]' } })),
    ).toBe('[]')
    expect(defaultOfProp(prop({ name: 'a', defaultValue: { kind: 'reference', name: 'x' } }))).toBe(
      'x',
    )
  })
})

describe('printPropsInterface', () => {
  it('declares every prop optional, because each one has a default', () => {
    const printed = printPropsInterface(
      'PlanCard',
      [prop({ name: 'plan' }), prop({ name: 'price', type: 'number' })],
      TS,
    )

    expect(printed).toBe('export interface PlanCardProps {\n  plan?: string\n  price?: number\n}')
    expect(propsTypeName('PlanCard')).toBe('PlanCardProps')
  })

  it('is absent for a component with no props', () => {
    expect(printPropsInterface('Nav', [], TS)).toBeUndefined()
  })

  it('is absent for a JavaScript export, which has nowhere to put it', () => {
    expect(printPropsInterface('PlanCard', [prop({ name: 'plan' })], JS)).toBeUndefined()
  })
})

describe('printPropsParameter', () => {
  it('is empty for a component with no props', () => {
    expect(printPropsParameter('Nav', [], TS, 0)).toBe('')
  })

  it('destructures with defaults on one line while it fits', () => {
    const printed = printPropsParameter(
      'PlanCard',
      [
        prop({ name: 'plan', defaultValue: { kind: 'literal', value: 'Pro' } }),
        prop({ name: 'price', type: 'number', defaultValue: { kind: 'literal', value: 29 } }),
      ],
      TS,
      30,
    )

    expect(printed).toBe("{ plan = 'Pro', price = 29 }: PlanCardProps")
  })

  it('breaks one property per line once the signature would run long', () => {
    const printed = printPropsParameter(
      'HeroSection',
      [
        prop({
          name: 'title',
          defaultValue: { kind: 'literal', value: 'Design motion, ship code' },
        }),
        prop({
          name: 'subtitle',
          defaultValue: { kind: 'literal', value: 'A visual editor for modern React interfaces.' },
        }),
      ],
      TS,
      30,
    )

    expect(printed).toBe(
      "{\n  title = 'Design motion, ship code',\n  subtitle = 'A visual editor for modern React interfaces.',\n}: HeroSectionProps",
    )
  })

  it('carries no type annotation in a JavaScript export', () => {
    const printed = printPropsParameter(
      'PlanCard',
      [prop({ name: 'plan', defaultValue: { kind: 'literal', value: 'Pro' } })],
      JS,
      30,
    )

    expect(printed).toBe("{ plan = 'Pro' }")
  })
})
