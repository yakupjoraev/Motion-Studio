import { type ReactElement, type ReactNode, Suspense, lazy } from 'react'

/**
 * PERFORMANCE.md § Bundle, and the `/studio` first-load budget of the contract. `ControlFields`
 * names every control kind, so a static import of each would put the colour maths, the shadow stack
 * editor, the gradient track and the whole icon registry in the panel's first chunk — 70 kB gzip of
 * controls a heading never renders. The eight kinds the common inspector actually draws stay static;
 * everything here is a chunk that arrives when a block first declares it.
 *
 * These live beside the switch rather than inside it because a `lazy` call is a module-level
 * declaration: one per control, read as a list, and the list is the bundle contract.
 */
export const ColorField = lazy(() =>
  import('../color-field/index').then((module) => ({ default: module.ColorField })),
)
export const AlignField = lazy(() =>
  import('../align-field/index').then((module) => ({ default: module.AlignField })),
)
export const CssField = lazy(() =>
  import('../css-field/index').then((module) => ({ default: module.CssField })),
)
export const FontField = lazy(() =>
  import('../font-field/index').then((module) => ({ default: module.FontField })),
)
export const GradientControl = lazy(() =>
  import('./gradient-control').then((module) => ({ default: module.GradientControl })),
)
export const IconControl = lazy(() =>
  import('./icon-control').then((module) => ({ default: module.IconControl })),
)
export const ImageField = lazy(() =>
  import('../image-field/index').then((module) => ({ default: module.ImageField })),
)
export const LinkField = lazy(() =>
  import('../link-field/index').then((module) => ({ default: module.LinkField })),
)
export const ListControl = lazy(() =>
  import('./list-control').then((module) => ({ default: module.ListControl })),
)
export const RadiusField = lazy(() =>
  import('../radius-field/index').then((module) => ({ default: module.RadiusField })),
)
export const RichTextField = lazy(() =>
  import('../rich-text-field/index').then((module) => ({ default: module.RichTextField })),
)
export const ShadowField = lazy(() =>
  import('../shadow-field/index').then((module) => ({ default: module.ShadowField })),
)
export const SpacingField = lazy(() =>
  import('../spacing-field/index').then((module) => ({ default: module.SpacingField })),
)

/** One skeleton for every deferred control: the row keeps its height while the chunk arrives. */
export const Deferred = ({ children }: { readonly children: ReactNode }): ReactElement => (
  <Suspense fallback={<span className="h-7 w-full rounded-xs bg-surface-2" />}>{children}</Suspense>
)
