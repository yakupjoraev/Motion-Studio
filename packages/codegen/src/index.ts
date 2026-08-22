export {
  ASSET_MODES,
  DEFAULT_EXPORT_OPTIONS,
  EXPORT_TARGETS,
  IMAGE_COMPONENTS,
  resolveOptions,
  type AssetMode,
  type ExportOptions,
  type ExportTarget,
  type ImageComponent,
} from './options.types'
export {
  INLINE_ASSET_BUDGET,
  WARNING_CODES,
  WARNING_DOCS,
  warning,
  type IRWarning,
  type WarningCode,
} from './warnings'
export { hash, hashValue, stableStringify } from './hash'

export {
  CODEGEN_ERROR_CODES,
  MOTION_MODULE_PATH,
  buildIR,
  toIRTheme,
} from './ir/build-ir'
export type {
  BuildIRInput,
  CodegenIR,
  ComponentName,
  HoistedConst,
  IRAsset,
  IRChild,
  IRClient,
  IRComponent,
  IRElement,
  IRExpression,
  IRModule,
  IRProp,
  IRRule,
  IRStylesheet,
  IRText,
  IRTheme,
  IRValue,
} from './ir/ir.types'

export {
  SECTION_CATEGORIES,
  detectComponents,
  type Boundaries,
  type ComponentUnit,
  type DetectInput,
  type UnitKind,
} from './ir/passes/detect-components'
export { extractRepeats, shapeHashes, type RepeatInput } from './ir/passes/extract-repeats'
export {
  MAX_COMPONENT_NAME,
  fileNameFor,
  toComponentName,
  uniqueName,
} from './ir/passes/name-components'
export { generateClasses, type ClassResult } from './ir/passes/generate-classes'
export {
  DEPENDENCIES,
  EMPTY_MOTION,
  createMotionCollector,
  type MotionCollector,
  type NodeMotion,
} from './ir/passes/collect-motion'
export {
  REDUCED_FLAG,
  REDUCED_HOOK,
  reducedMotionRules,
  toValue,
  withReducedMotion,
} from './ir/passes/reduced-motion'
export { collectImports } from './ir/passes/collect-imports'
export {
  createAssetCollector,
  type AssetCollector,
  type AssetResult,
} from './ir/passes/handle-assets'
export { familyRank, sortClasses, splitVariant, type ClassParts } from './ir/tailwind/class-order'
export { mergeAndSort } from './ir/tailwind/merge-classes'
