'use client'

import type { ReactNode, RefObject } from 'react'

import { SCENE_CLASS, SCENE_TRANSFORM } from '../canvas.styles'

export interface SceneProps {
  readonly sceneRef: RefObject<HTMLDivElement | null>
  readonly children: ReactNode
}

/**
 * The one transformed element. It reads the three viewport variables and nothing else, which is what
 * lets a pan be a variable write instead of a render — CANVAS.md § DOM structure.
 */
export function Scene({ sceneRef, children }: SceneProps) {
  return (
    <div
      className={SCENE_CLASS}
      data-testid="canvas-scene"
      ref={sceneRef}
      style={{ transform: SCENE_TRANSFORM }}
    >
      {children}
    </div>
  )
}
