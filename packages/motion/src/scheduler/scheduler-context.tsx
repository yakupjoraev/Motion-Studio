'use client'

import { type ReactNode, createContext, useContext, useEffect, useMemo } from 'react'

import { type MotionSchedulerHandle, createScheduler } from './create-scheduler'
import type { ScrollSource } from './scroll-bus'

const SchedulerContext = createContext<MotionSchedulerHandle | null>(null)

export interface MotionSchedulerProviderProps {
  /** The scrolling context. Absent means the window, which is what a page scrolls. */
  readonly source?: ScrollSource
  /** ADR-100's flag. It arrives as a prop because the store belongs to the application, not here. */
  readonly paused?: boolean
  readonly children: ReactNode
}

/**
 * One scheduler for the tree below it. Mounting a second provider is legal and sometimes right — the
 * studio's canvas scrolls in its own container — but a node reads the nearest one, so the sharing that
 * § The scheduler is about happens inside each scrolling context.
 */
export function MotionSchedulerProvider({
  source,
  paused = false,
  children,
}: MotionSchedulerProviderProps) {
  const scheduler = useMemo(() => createScheduler(source === undefined ? {} : { source }), [source])

  useEffect(() => () => scheduler.destroy(), [scheduler])

  useEffect(() => {
    scheduler.setPaused(paused)
  }, [paused, scheduler])

  return <SchedulerContext.Provider value={scheduler}>{children}</SchedulerContext.Provider>
}

/**
 * `null` outside a provider rather than a throw: a block rendered in Storybook or in an exported page
 * has no studio around it, and a preset that finds no scheduler simply does not subscribe.
 */
export function useScheduler(): MotionSchedulerHandle | null {
  return useContext(SchedulerContext)
}
