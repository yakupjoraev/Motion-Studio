import type { Preview } from '@storybook/react'

/**
 * The toolbar declaration type. `@storybook/react` does not export `GlobalTypes` by name, and reaching
 * into `storybook/internal/*` for it would be a deep import into a package's private surface — so it is
 * read off `Preview`, which is the public type that carries it.
 */
export type ToolbarGlobals = NonNullable<Preview['globalTypes']>

/**
 * Reading a toolbar global back is the one place this app meets untyped data: Storybook types
 * `globals` as an open record. Every read goes through here, so the narrowing happens once and no
 * decorator has to assert a type it cannot check.
 */
export function readGlobal<T extends string>(
  value: unknown,
  allowed: readonly T[],
  fallback: T,
): T {
  return allowed.find((entry) => entry === value) ?? fallback
}
