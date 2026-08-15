import type { MotionSpec, MotionStagger } from '@motion-studio/schema'

import { policyFor, reduce } from '../reduced/policy'

import {
  DISABLED_MOTION,
  type MotionPreset,
  type MotionPresetRegistry,
  type PresetParams,
  type ResolveContext,
  type ResolvedMotion,
} from './preset.types'
import { scaleMotion } from './scale'

/**
 * One entry per distinct resolution. A 200-node document with three channels each is 600, so the bound
 * holds a full document with room over it, and eviction is oldest-first — the entries a long editing
 * session stops asking for are the ones written earliest.
 */
const CACHE_LIMIT = 1024

const cache = new Map<string, ResolvedMotion>()

/** ADR-141: zero scale is the reduced experience, not a zero-length version of the full one. */
export const isReduced = (ctx: ResolveContext): boolean => ctx.reduced || ctx.scale === 0

/**
 * ANIMATION_SYSTEM.md § The model, the `resolve` step: pure, memoised on the four things that change
 * the answer. Same inputs give the same reference, which is what lets a memoised component skip a
 * re-render — `useResolvedMotion` in prompt 34 is a thin wrapper over this.
 */
export function resolveMotion(spec: MotionSpec, ctx: ResolveContext): ResolvedMotion {
  if (spec.disabled === true) {
    return DISABLED_MOTION
  }

  const preset = ctx.presets.get(spec.presetId)

  // ADR-138: a document written by a newer build loses its animation, not its node.
  if (preset === undefined) {
    return DISABLED_MOTION
  }

  const key = cacheKey(spec, ctx)
  const hit = cache.get(key)

  if (hit !== undefined) {
    return hit
  }

  const resolved = build(preset, spec, ctx)

  if (cache.size >= CACHE_LIMIT) {
    const oldest = cache.keys().next()

    if (!oldest.done) {
      cache.delete(oldest.value)
    }
  }

  cache.set(key, resolved)

  return resolved
}

/** Between tests, and after a catalogue is replaced: the key carries the registry, but not its contents. */
export function clearResolutionCache(): void {
  cache.clear()
}

function build(preset: MotionPreset, spec: MotionSpec, ctx: ResolveContext): ResolvedMotion {
  const params = parseParams(preset, spec.params)
  const reduced = isReduced(ctx)
  const base = reduced ? preset.resolveReduced(params, ctx) : preset.resolve(params, ctx)
  // ADR-142: the policy is the floor, whatever the preset returned.
  const policed = reduced ? reduce(base, policyFor(spec.channel)) : base

  return scaleMotion(withStagger(policed, spec.stagger), ctx.scale)
}

/** ADR-139: params that do not parse fall back to the preset's own defaults. */
function parseParams(preset: MotionPreset, params: PresetParams): PresetParams {
  const parsed = preset.paramsSchema.safeParse(params)

  return parsed.success ? parsed.data : preset.defaults
}

/** The document's stagger, which belongs to the node rather than to the preset. */
function withStagger(resolved: ResolvedMotion, stagger: MotionStagger | undefined): ResolvedMotion {
  if (stagger === undefined || resolved === DISABLED_MOTION) {
    return resolved
  }

  return { ...resolved, transition: { ...resolved.transition, stagger } }
}

/**
 * Registries are identified rather than serialised: two catalogues can hold different presets under
 * one id, and a key that could not tell them apart would answer with the wrong preset's resolution.
 */
const registryIds = new WeakMap<MotionPresetRegistry, number>()

let nextRegistryId = 0

function registryId(registry: MotionPresetRegistry): number {
  const known = registryIds.get(registry)

  if (known !== undefined) {
    return known
  }

  nextRegistryId += 1
  registryIds.set(registry, nextRegistryId)

  return nextRegistryId
}

function cacheKey(spec: MotionSpec, ctx: ResolveContext): string {
  const stagger = spec.stagger === undefined ? '' : `${spec.stagger.each}/${spec.stagger.from}`

  return [
    registryId(ctx.presets),
    spec.presetId,
    spec.channel,
    hashParams(spec.params),
    stagger,
    ctx.reduced ? 'reduced' : 'full',
    ctx.scale,
  ].join('|')
}

/** Key order is not part of a param set, so it is not part of its hash. */
const hashParams = (params: PresetParams): string =>
  Object.keys(params)
    .sort()
    .map((key) => `${key}=${String(params[key])}`)
    .join(',')
