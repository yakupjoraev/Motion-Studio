/**
 * The maths, with no React in its graph.
 *
 * `@motion-studio/motion`'s barrel exports `FramerMotion`, so one import of `simulateSpring` from it
 * put 36.4 kB of animation runtime into the first load of every page that renders a control — the
 * block gallery's detail page, measured, and `/studio` with it (ADR-305). This entry point is what a
 * consumer that wants a curve rather than a component imports.
 *
 * `./curves` already existed and pointed at `easings.ts` alone; it points here instead, which is
 * additive for anyone already importing it.
 */
export * from './easings'
export * from './bezier'
export * from './simulate'
export * from './springs'
