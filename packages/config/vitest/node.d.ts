import type { ViteUserConfig } from 'vitest/config'

/**
 * Hand-written beside `node.mjs`, because that file is JavaScript for the reason ADR-048 records and
 * the repository has no build step to derive this from it. Two exports; the pairing is checked by
 * `tsc --noEmit` in every package that consumes the preset.
 */
export declare const coverageExclude: readonly string[]

export declare const nodeConfig: ViteUserConfig
