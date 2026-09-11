import type { CSSProperties } from 'react'

/**
 * The eight sandboxes — PLAYGROUND.md § Property sandboxes, its table read as data. Each entry names
 * the property and whether it takes a comma-separated layer list, which is what `Alt+click` on a
 * preset appends to. The line describing each sandbox is a dictionary entry rather than a field here:
 * it is read by a visitor, so it is written in their language.
 *
 * The starting value is a real one rather than an empty string: a sandbox that opens blank asks the
 * reader to invent something before it shows them anything.
 */
export const PLAYGROUND_PROPERTIES = [
  'background',
  'box-shadow',
  'filter',
  'backdrop-filter',
  'mask-image',
  'clip-path',
  'transform',
  'transition',
] as const

export type PlaygroundProperty = (typeof PLAYGROUND_PROPERTIES)[number]

/** A string from a URL or a document is not a sandbox until this says so. */
export const isPlaygroundProperty = (value: string): value is PlaygroundProperty =>
  (PLAYGROUND_PROPERTIES as readonly string[]).includes(value)

export interface PropertyDescriptor {
  readonly id: PlaygroundProperty
  readonly label: string
  /** Comma-separated layers, so a preset can be appended rather than replacing — § Presets. */
  readonly layerable: boolean
  readonly initial: string
}

export const PROPERTY_DESCRIPTORS: Readonly<Record<PlaygroundProperty, PropertyDescriptor>> = {
  background: {
    id: 'background',
    label: 'background',
    layerable: true,
    initial:
      'radial-gradient(60% 60% at 30% 20%, oklch(62% 0.19 285), transparent 70%),\n  radial-gradient(50% 50% at 75% 60%, oklch(70% 0.15 210), transparent 70%),\n  oklch(20% 0.01 265)',
  },
  'box-shadow': {
    id: 'box-shadow',
    label: 'box-shadow',
    layerable: true,
    initial: '0 1px 2px oklch(0% 0 0 / 0.16),\n  0 8px 24px oklch(0% 0 0 / 0.18)',
  },
  filter: {
    id: 'filter',
    label: 'filter',
    layerable: false,
    initial: 'saturate(1.4) contrast(1.1)',
  },
  'backdrop-filter': {
    id: 'backdrop-filter',
    label: 'backdrop-filter',
    layerable: false,
    initial: 'blur(12px) saturate(160%)',
  },
  'mask-image': {
    id: 'mask-image',
    label: 'mask-image',
    layerable: true,
    initial: 'linear-gradient(to bottom, black 40%, transparent 100%)',
  },
  'clip-path': {
    id: 'clip-path',
    label: 'clip-path',
    layerable: false,
    initial: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
  },
  transform: {
    id: 'transform',
    label: 'transform',
    layerable: false,
    initial: 'rotateX(14deg) rotateY(-18deg) translateZ(40px)',
  },
  transition: {
    id: 'transition',
    label: 'transition',
    layerable: false,
    initial: 'transform 600ms cubic-bezier(0.16, 1, 0.3, 1)',
  },
}

export const propertyDescriptor = (property: PlaygroundProperty): PropertyDescriptor =>
  PROPERTY_DESCRIPTORS[property]

/**
 * The starting value as a React style object, so the server paints the sandbox — see `TargetProps`.
 * React's style keys are camel-cased, and these eight are the whole set this page ever writes.
 */
export const styleFor = (property: PlaygroundProperty, value: string): CSSProperties => ({
  [property.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase())]: value,
})
