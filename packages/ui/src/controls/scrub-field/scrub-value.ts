import { clamp, round } from '@motion-studio/utils'

/**
 * `ACCESSIBILITY.md` § Inspector wants "16 pixels", not "16 px". Units with no spoken form — `rem`,
 * `fr` — are announced as written, which is how a designer says them out loud anyway.
 */
const UNIT_WORDS: Readonly<Record<string, string>> = {
  px: 'pixels',
  '%': 'percent',
  deg: 'degrees',
  ms: 'milliseconds',
  s: 'seconds',
  x: 'times',
}

export interface ScrubBounds {
  readonly min?: number
  readonly max?: number
  readonly step: number
  readonly precision: number
}

/** Decimals in the step, so a step of `0.1` displays one decimal without the caller saying so. */
export function precisionOfStep(step: number): number {
  const [, decimals] = String(step).split('.')

  return decimals?.length ?? 0
}

/**
 * `Shift` ×10 and `Alt` ×0.1 are independent factors, so holding both is ×1. Read from the event on
 * every move rather than captured at drag start — prompt 09 requires the change to apply mid-drag.
 */
export function modifierScale(event: {
  readonly shiftKey: boolean
  readonly altKey: boolean
}): number {
  return (event.shiftKey ? 10 : 1) * (event.altKey ? 0.1 : 1)
}

/** Snapped to the step grid, held inside the bounds, and rounded away from binary-float noise. */
export function quantize(value: number, bounds: ScrubBounds): number {
  const snapped = bounds.step === 0 ? value : Math.round(value / bounds.step) * bounds.step
  const bounded = clamp(snapped, bounds.min ?? -Number.MAX_VALUE, bounds.max ?? Number.MAX_VALUE)

  return round(bounded, bounds.precision)
}

export function formatValue(value: number, precision: number): string {
  return value.toFixed(precision)
}

/** What the field shows when nothing is being typed into it: the number with its unit attached. */
export function formatDisplay(value: number, precision: number, unit?: string): string {
  return `${formatValue(value, precision)}${unit ?? ''}`
}

export function speakValue(value: number, precision: number, unit?: string): string {
  if (unit === undefined) {
    return formatValue(value, precision)
  }

  return `${formatValue(value, precision)} ${UNIT_WORDS[unit] ?? unit}`
}

/** A typed value may carry the unit; the expression grammar has no place for letters. */
export function stripUnit(input: string, unit?: string): string {
  return unit === undefined ? input : input.split(unit).join('')
}
