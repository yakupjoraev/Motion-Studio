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
  TRANSFORM_COMPONENTS,
  collides,
  composeMotion,
  motionProperties,
  type ComposedMotion,
  type MotionConflict,
  type MotionPart,
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

export {
  CAPS,
  CONTINUOUS_CAP,
  GPU_HEAVY_CAP,
  createCapPool,
  type CapKind,
  type CapPool,
} from './scheduler/caps'
export { createFrameLoop, type FrameLoop, type FrameLoopOptions } from './scheduler/frame-loop'
export {
  THRESHOLD_BUCKETS,
  bucketFor,
  createIntersectionPool,
  type IntersectionPool,
  type ThresholdBucket,
} from './scheduler/intersection-pool'
export { createPointerBus, type PointerBus } from './scheduler/pointer-bus'
export {
  createScrollBus,
  elementScrollSource,
  windowScrollSource,
  type ScrollBus,
  type ScrollSource,
} from './scheduler/scroll-bus'
export {
  createScheduler,
  type MotionSchedulerHandle,
  type SchedulerOptions,
} from './scheduler/create-scheduler'
export {
  MotionSchedulerProvider,
  useScheduler,
  type MotionSchedulerProviderProps,
} from './scheduler/scheduler-context'
export type {
  FrameCallback,
  MotionScheduler,
  ScrollProgress,
  Unsubscribe,
  VisibilityCallback,
} from './scheduler/scheduler.types'

export { MotionNode, assertOneEngine, type MotionNodeProps } from './apply/motion-node'
export { CssMotion, type CssMotionProps } from './apply/css-motion'
export { FramerMotion, type FramerMotionProps } from './apply/framer-motion'
export { GsapMotion, type GsapMotionProps } from './apply/gsap-motion'
export { toStyle, toTransition } from './apply/to-style'
export { useResolvedMotion, type NodeMotion } from './apply/use-resolved-motion'
export { useWillChange, type WillChangeHandle } from './apply/use-will-change'

export { PRESETS, presetRegistry } from './presets/index'
export { ENTRANCE_PRESETS } from './presets/entrance/index'
export { HOVER_PRESETS, magneticOffset, tiltAngles } from './presets/hover/index'
export { CONTINUOUS_PRESETS } from './presets/continuous/index'
export {
  MARQUEE_CLASS,
  MARQUEE_CSS,
  MARQUEE_PAUSABLE_CLASS,
  SCROLL_PRESETS,
  marqueeCssVars,
  marqueeTrack,
  type MarqueeDirection,
} from './presets/scroll/index'
export { CURSOR_PRESETS } from './presets/cursor/index'
export { EXIT_PRESETS } from './presets/exit/index'
export {
  EASING_OPTIONS,
  FLASH_SAFE_MIN_MS,
  SPRING_OPTIONS,
  easingNameSchema,
  springNameSchema,
} from './presets/shared'
