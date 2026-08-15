export { EASINGS, EASING_NAMES, type EasingCurve, type EasingName } from './curves/easings'
export {
  SPRINGS,
  SPRING_NAMES,
  dampingRatio,
  type SpringName,
} from './curves/springs'
export { simulateSpring, type SpringConfig } from './curves/simulate'
export { cubicBezier, fromCssString, toCssString } from './curves/bezier'

export {
  DISABLED_MOTION,
  type ListenerSpec,
  type MotionPreset,
  type MotionPresetId,
  type MotionPresetRegistry,
  type PresetCapabilities,
  type PresetParams,
  type ResolveContext,
  type ResolvedMotion,
  type TargetProperties,
  type TargetValue,
  type TransitionConfig,
} from './model/preset.types'
export {
  createPresetRegistry,
  definePreset,
  type DefinePresetConfig,
} from './model/define-preset'
export { clearResolutionCache, isReduced, resolveMotion } from './model/resolve'
export {
  CHANNEL_PRECEDENCE,
  composeMotion,
  motionProperties,
  type ComposedMotion,
  type MotionConflict,
} from './model/compose'
export { MOTION_SCALES, scaleDuration, scaleMotion, type MotionScale } from './model/scale'

export {
  REDUCE_POLICY,
  policyFor,
  reduce,
  type ReduceKind,
  type ReducePolicy,
} from './reduced/policy'
export {
  REDUCED_MOTION_QUERY,
  getReducedMotion,
  subscribeReducedMotion,
  useReducedMotion,
} from './reduced/use-reduced-motion'

export type {
  CodegenContext,
  MotionCodegenFragment,
  NamedHelper,
} from './codegen/fragment.types'
