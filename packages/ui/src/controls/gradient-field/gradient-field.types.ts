import type { Gradient } from '@motion-studio/tokens'

import type { ColorTokenPreset } from '../color-picker/index'
import type { ValueControlProps } from '../control-row/index'

export type GradientKind = Gradient['kind']

/** The kinds built from a stop track. Mesh is a preset, not something this editor writes — ADR-044. */
export type StopGradientKind = Exclude<GradientKind, 'mesh'>

export interface GradientFieldProps extends ValueControlProps<Gradient> {
  /** `COMPONENT_LIBRARY.md` § Control kinds names this prop. Defaults to all three stop kinds. */
  readonly kinds?: readonly StopGradientKind[] | undefined
  /** Passed through to the per-stop colour picker. */
  readonly tokens?: readonly ColorTokenPreset[] | undefined
}
