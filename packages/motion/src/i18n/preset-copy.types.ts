import type { MotionChannel } from '@motion-studio/schema'

/**
 * The catalogue's strings in another language. Names are keyed by preset id and control labels by
 * their English string — ADR-365's scheme, and for the reason it gives: `Duration` is one entry
 * whether it appears on one preset or on thirty.
 *
 * The presets themselves keep their English (`definePreset` declares it), so this table is data the
 * server hands the studio rather than a second declaration of the catalogue.
 */
export interface PresetCopy {
  readonly presets: Readonly<Record<string, string>>
  readonly channels: Readonly<Record<MotionChannel, string>>
  readonly labels: Readonly<Record<string, string>>
}
