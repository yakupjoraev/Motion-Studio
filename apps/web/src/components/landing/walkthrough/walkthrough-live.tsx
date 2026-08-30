'use client'

import { createScrollBus, windowScrollSource } from '@motion-studio/motion'
import { clamp, lerp } from '@motion-studio/utils'
import { useEffect, useRef, useState } from 'react'

import { END, START, WalkthroughPanel } from './walkthrough-values'

/**
 * The value follows the scroll — `prompts/51`: "as the visitor scrolls, a value in a mock inspector
 * changes and the preview beside it responds."
 *
 * It reads the shared scroll bus rather than adding a listener of its own: one passive listener per
 * page, one measurement per frame, handed to every subscriber (ANIMATION_SYSTEM.md § Scheduler). The
 * element's own progress is computed from its rect inside that one callback.
 */
export interface WalkthroughLiveProps {
  readonly note: string
}

export function WalkthroughLive({ note }: WalkthroughLiveProps) {
  const frame = useRef<HTMLDivElement | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const bus = createScrollBus({ source: windowScrollSource() })

    const read = (): void => {
      const element = frame.current

      if (element === null) {
        return
      }

      const rect = element.getBoundingClientRect()
      const span = window.innerHeight + rect.height

      // 0 when the panel's top edge enters from below, 1 when its bottom edge leaves at the top.
      setProgress(clamp((window.innerHeight - rect.top) / span, 0, 1))
    }

    read()

    return bus.subscribe(read)
  }, [])

  // The middle half of the pass carries the whole change, so the ends are settled rather than moving.
  const eased = clamp((progress - 0.25) / 0.5, 0, 1)

  return (
    <div className="flex flex-col gap-3" ref={frame}>
      <WalkthroughPanel
        caption={`scroll position ${Math.round(eased * 100)}%`}
        values={{
          radius: Math.round(lerp(START.radius, END.radius, eased)),
          glow: lerp(START.glow, END.glow, eased),
        }}
      />
      <p className="text-foreground-muted text-sm">{note}</p>
    </div>
  )
}
