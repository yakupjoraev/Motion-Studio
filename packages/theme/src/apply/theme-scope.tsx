'use client'

// A client component: it holds a ref and writes variables in a layout effect, so it cannot render on
// the server. The directive lives here rather than on the barrel so a server component importing, say,
// COLOR_MODE_SCRIPT does not pull React hooks into its graph.

import { type ReactNode, useLayoutEffect, useRef } from 'react'

import { applyTheme } from './apply-theme'

import type { ThemeConfig } from '../theme.types'

export interface ThemeScopeProps {
  readonly theme: ThemeConfig
  readonly children: ReactNode
  readonly className?: string
}

/**
 * `THEME_ENGINE.md` § Scoped themes. The block gallery renders many previews, each possibly in a
 * different theme, so `applyTheme` accepts any element and this applies the variables to a wrapper
 * instead of the root.
 *
 * Because everything resolves through variables, nesting works with no extra machinery: an inner scope's
 * inline variables shadow the outer scope's for its own subtree, exactly as CSS inheritance already
 * does. `theme-scope.test.tsx` asserts that with two levels.
 *
 * `useLayoutEffect` rather than `useEffect`: the variables have to be on the element before the browser
 * paints its children, or the preview flashes the outer theme first.
 */
export function ThemeScope({ theme, children, className }: ThemeScopeProps) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const element = ref.current
    if (element !== null) {
      applyTheme(theme, { root: element })
    }
  }, [theme])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
