import type { ReactElement, SVGProps } from 'react'

/**
 * `DESIGN_SYSTEM.md` § Iconography: every icon is a React component with `size` and `strokeWidth`.
 *
 * `width` and `height` are removed from the underlying SVG props because `size` sets both — two ways to
 * say the same thing is how a 16 px icon ends up 16 × 20.
 */
export interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'width' | 'height'> {
  /** Both dimensions, in px. Defaults to 16 — `UI_GUIDELINES.md` § Character: 16 in panels, 20 in the toolbar. */
  readonly size?: number
  /** Defaults to 1.5, the documented stroke. Raise it only for an icon rendered far above 20 px. */
  readonly strokeWidth?: number
}

/**
 * `displayName` is part of the type rather than an afterthought: `createIcon` always sets it, and a
 * component tree full of anonymous `Icon` nodes is unreadable in a devtools inspector.
 */
export type IconComponent = ((props: IconProps) => ReactElement) & { displayName: string }
