'use client'

import { type RefObject, useCallback, useEffect, useRef, useState } from 'react'

import type { CompareSide } from './compare-mode/compare-tabs'
import { type PlaygroundProperty, propertyDescriptor } from './properties'
import { decodePermalink } from './sharing/permalink'
import { type ApplyCss, useApplyCss } from './use-apply-css'

export interface PlaygroundState {
  readonly property: PlaygroundProperty
  setProperty: (next: PlaygroundProperty) => void
  readonly compare: boolean
  setCompare: (next: boolean) => void
  readonly side: CompareSide
  setSide: (next: CompareSide) => void
  readonly a: ApplyCss
  readonly b: ApplyCss
  /** The half the editor edits. With the split off there is only ever A. */
  readonly active: ApplyCss
  swap: () => void
  readonly targetA: RefObject<HTMLDivElement | null>
  readonly targetB: RefObject<HTMLDivElement | null>
  /** Why a link in the address bar was not used, when it was not. */
  readonly linkError: string
}

/**
 * The page's state, in one place: which sandbox, the two values the split compares, and the permalink
 * the page may have been opened with.
 *
 * The link is read in an effect rather than during render — `window.location` does not exist on the
 * server, and a value that differed between the two would be a hydration mismatch.
 */
export function usePlaygroundState(): PlaygroundState {
  const [property, setProperty] = useState<PlaygroundProperty>('background')
  const [compare, setCompare] = useState(false)
  const [side, setSide] = useState<CompareSide>('a')
  const [booted, setBooted] = useState<{ property: PlaygroundProperty; value: string } | undefined>(
    undefined,
  )
  const [linkError, setLinkError] = useState('')
  const targetA = useRef<HTMLDivElement | null>(null)
  const targetB = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const hash = window.location.hash

    if (hash === '' || !hash.includes('p=')) {
      return
    }

    const decoded = decodePermalink(hash)

    if (decoded.ok) {
      setBooted(decoded.value)
      setProperty(decoded.value.property)

      return
    }

    setLinkError(decoded.error)
  }, [])

  const descriptor = propertyDescriptor(property)
  const initial = booted?.property === property ? booted.value : descriptor.initial
  const a = useApplyCss(property, targetA, initial)
  const b = useApplyCss(property, targetB, descriptor.initial)
  const active = compare && side === 'b' ? b : a

  const swap = useCallback(() => {
    const left = a.value
    const right = b.value

    a.setValue(right)
    b.setValue(left)
  }, [a, b])

  return {
    property,
    setProperty,
    compare,
    setCompare,
    side,
    setSide,
    a,
    b,
    active,
    swap,
    targetA,
    targetB,
    linkError,
  }
}
