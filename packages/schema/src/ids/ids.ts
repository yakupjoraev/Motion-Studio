import { MotionStudioError } from '@motion-studio/utils'
import { z } from 'zod'

/**
 * Branded ids. A `BlockId` is not a `NodeId` and the compiler says so — every function in the editor,
 * the canvas, and the code generator takes one of these, and a swapped argument is the mistake that
 * would otherwise typecheck and then corrupt a document at runtime.
 *
 * The brand is a phantom property: it exists in the type and not in the emitted value, so an id is a
 * plain string in JSON and costs nothing to serialise.
 */
export type NodeId = string & { readonly __brand: 'NodeId' }
export type BlockId = string & { readonly __brand: 'BlockId' }
export type AssetId = string & { readonly __brand: 'AssetId' }
export type EffectId = string & { readonly __brand: 'EffectId' }

/**
 * FILE_FORMAT.md § Ids: a prefix, then up to 32 opaque characters. The generator in `utils` emits 22
 * base58 characters; the pattern is wider than that on purpose, because `counterIds()` produces
 * `node_1` in tests and a document written by a test fixture must be a legal document.
 */
export const NODE_ID_RE = /^node_[A-Za-z0-9_-]{1,32}$/
export const ASSET_ID_RE = /^asset_[A-Za-z0-9_-]{1,32}$/
export const DOCUMENT_ID_RE = /^doc_[A-Za-z0-9_-]{1,32}$/
export const EFFECT_INSTANCE_ID_RE = /^fx_[A-Za-z0-9_-]{1,32}$/

/**
 * A `BlockId` and an `EffectId` are catalogue names rather than generated ids — `hero-aurora`,
 * `noise-overlay`. They appear in exported file names and in the palette, so they are kebab-case and
 * nothing else. FILE_FORMAT.md § Security: a block id is never used to resolve a module path, which is
 * what makes a strict pattern here worth having.
 */
export const CATALOGUE_ID_RE = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/

export const ID_CODES = {
  invalidId: 'INVALID_ID',
} as const

export class InvalidIdError extends MotionStudioError {
  constructor(kind: string, value: string) {
    super(`Not a valid ${kind}: ${JSON.stringify(value)}`, ID_CODES.invalidId)
  }
}

const idConstructor =
  <T extends string>(kind: string, pattern: RegExp) =>
  (value: string): T => {
    if (!pattern.test(value)) {
      throw new InvalidIdError(kind, value)
    }

    return value as T
  }

/** Throws on bad input: a malformed id inside the app is a programmer mistake, not a user failure. */
export const nodeId = idConstructor<NodeId>('NodeId', NODE_ID_RE)
export const blockId = idConstructor<BlockId>('BlockId', CATALOGUE_ID_RE)
export const assetId = idConstructor<AssetId>('AssetId', ASSET_ID_RE)
export const effectId = idConstructor<EffectId>('EffectId', CATALOGUE_ID_RE)

/**
 * The effects category lives in the same registry as every other block — COMPONENT_LIBRARY.md
 * § Catalogue lists it there — so looking one up means presenting its id as the `BlockId` the
 * registry takes. The two brands stay separate because a *node* holds a `BlockId` and an
 * *effect instance* holds an `EffectId`, and swapping those is the mistake the brands exist to
 * catch; this is the one place the crossing is legal, and it revalidates rather than casting.
 */
export const effectBlockId = (id: EffectId): BlockId => blockId(id)

/** Untrusted input goes through these instead, where a bad id is a reported failure. */
export const nodeIdSchema = z
  .string()
  .regex(NODE_ID_RE)
  .transform((value) => value as NodeId)
export const blockIdSchema = z
  .string()
  .regex(CATALOGUE_ID_RE)
  .transform((value) => value as BlockId)
export const assetIdSchema = z
  .string()
  .regex(ASSET_ID_RE)
  .transform((value) => value as AssetId)
export const effectIdSchema = z
  .string()
  .regex(CATALOGUE_ID_RE)
  .transform((value) => value as EffectId)

/** The document's own id and an effect instance's id are opaque strings, not brands — nothing dispatches on them. */
export const documentIdSchema = z.string().regex(DOCUMENT_ID_RE)
export const effectInstanceIdSchema = z.string().regex(EFFECT_INSTANCE_ID_RE)
