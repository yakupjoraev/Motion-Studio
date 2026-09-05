import type { BlockCategory } from '@motion-studio/schema'

export interface BlockCopy {
  readonly name: string
  readonly description: string
}

/**
 * The registry's own strings in one language other than the one the definitions are written in.
 *
 * It lives beside the definitions rather than in the app because the strings are the registry's: a
 * block's name is part of the catalogue, not part of a page that happens to list it (ADR-365).
 *
 * `labels` and `hints` are keyed by the English string, which ADR-365 chose by measurement — 912
 * labels are 412 unique, and keying by string touched none of the 72 definition files.
 */
export interface RegistryCopy {
  readonly categories: Readonly<Record<BlockCategory, string>>
  readonly blocks: Readonly<Record<string, BlockCopy>>
  readonly labels: Readonly<Record<string, string>>
  readonly hints: Readonly<Record<string, string>>
}
