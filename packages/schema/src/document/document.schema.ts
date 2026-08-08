import { themeConfigSchema } from '@motion-studio/theme'
import { z } from 'zod'

import { breakpointIdSchema } from '../breakpoints/breakpoints'
import { effectInstanceSchema } from '../effects/effects.schema'
import {
  ASSET_ID_RE,
  NODE_ID_RE,
  assetIdSchema,
  blockIdSchema,
  documentIdSchema,
  nodeIdSchema,
} from '../ids/ids'
import { motionChannelSchema, motionSpecSchema } from '../motion/motion.schema'

import type { Asset, MotionDocument, Node } from './document.types'

/**
 * FILE_FORMAT.md § Schema, transcribed. Anything that needs the registry to decide is deliberately
 * loose here and validated in a second pass — see `props` below.
 *
 * A record's *key* schema stays a plain `z.string().regex(...)`: the branded id schemas carry a
 * `.transform`, and Zod's record keys accept a string schema rather than an effect. The values are
 * still branded, and `validateDocument` checks that every key equals its node's `id`, so a key that
 * is not a legal id cannot survive the pipeline.
 */
const nodeIdKeySchema = z.string().regex(NODE_ID_RE)
const assetIdKeySchema = z.string().regex(ASSET_ID_RE)

export const documentCanvasSchema = z.object({
  width: z.number().int().min(320).max(3840),
  background: z.string().min(1).max(80),
})

export const documentMetaSchema = z.object({
  id: documentIdSchema,
  name: z.string().min(1).max(120),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  generator: z.string().min(1).max(80),
  canvas: documentCanvasSchema,
  template: z.boolean().optional(),
})

export const assetSourceSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('url'), url: z.string().max(4096) }),
  z.object({ type: z.literal('data'), dataUrl: z.string().max(3_000_000) }),
])

export const assetSchema: z.ZodType<Asset, z.ZodTypeDef, unknown> = z.object({
  id: assetIdSchema,
  kind: z.enum(['image', 'video']),
  source: assetSourceSchema,
  width: z.number().int().min(1).max(20_000),
  height: z.number().int().min(1).max(20_000),
  alt: z.string().max(300),
  blurDataUrl: z.string().max(8192).optional(),
})

export const nodeSchema: z.ZodType<Node, z.ZodTypeDef, unknown> = z.object({
  id: nodeIdSchema,
  blockId: blockIdSchema,
  name: z.string().min(1).max(80),
  parentId: nodeIdSchema.nullable(),
  slot: z.string().min(1).max(40),
  children: z.array(nodeIdSchema).max(500),
  // Per-block validation is a second pass: it needs the registry, which this package must not
  // depend on. A document referencing an unknown block still parses, so an import can report
  // "3 blocks are from a newer version" instead of refusing the file — FILE_FORMAT.md § Schema.
  props: z.record(z.unknown()).default({}),
  responsive: z.record(breakpointIdSchema, z.record(z.unknown())).default({}),
  motion: z.record(motionChannelSchema, motionSpecSchema).default({}),
  effects: z.array(effectInstanceSchema).max(8).default([]),
  locked: z.boolean().default(false),
  hidden: z.boolean().default(false),
})

export const documentSchema: z.ZodType<MotionDocument, z.ZodTypeDef, unknown> = z.object({
  $schema: z.string().max(200).optional(),
  version: z.number().int().positive(),
  meta: documentMetaSchema,
  theme: themeConfigSchema,
  rootId: nodeIdSchema,
  nodes: z.record(nodeIdKeySchema, nodeSchema),
  assets: z.record(assetIdKeySchema, assetSchema).default({}),
})

/** The first gate of the import pipeline: enough to read a version out of an arbitrary object. */
export const versionProbeSchema = z.object({ version: z.number().int().positive() })
