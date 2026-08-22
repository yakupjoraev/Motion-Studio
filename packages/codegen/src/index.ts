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

export {
  moduleExtension,
  withoutExtension,
  type ExportFile,
  type ExportResult,
  type PrintedTheme,
  type PrintInput,
} from './printers/printer.types'
export { isEmpty, printStylesheet } from './printers/print-stylesheet'
export { printJson, printJsonFile } from './printers/print-json'
export {
  FORMAT_CONFIG,
  formatFiles,
  loadPrettier,
  parserFor,
  type FormatOutcome,
} from './printers/format/format'
export {
  INDENT,
  PRINT_WIDTH,
  REACT_TYPE_IMPORT,
  STYLE_TYPE,
  needsStyleType,
  noteLines,
  printElement,
  structuredDataScript,
} from './printers/react/print-element'
export { printImport, printImports } from './printers/react/print-imports'
export { printHoisted, printModule } from './printers/react/print-hoisted'
export {
  defaultOfProp,
  printPropsInterface,
  printPropsParameter,
  propsTypeName,
  tsType,
  typeOfProp,
} from './printers/react/print-props'
export { USE_CLIENT, printComponent, type ComponentInput } from './printers/react/print-component'
export { printReact, referencedNames, referencesOf } from './printers/react/print-react'
export {
  DISPLAY_VARIABLE,
  MONO_VARIABLE,
  SANS_VARIABLE,
  fontPlan,
  type FontImport,
  type FontPlan,
} from './printers/next/fonts'
export { printLayout, type LayoutInput } from './printers/next/print-layout'
export {
  COMPONENTS_DIR,
  MISSING_ENTRY,
  componentSpecifier,
  printPage,
} from './printers/next/print-page'
export {
  TAILWIND_IMPORT,
  printGlobalsCss,
  type GlobalsInput,
} from './printers/next/print-globals-css'
export {
  POSTCSS_CONFIG,
  RUNTIME_VERSIONS,
  TOOLING_VERSIONS,
  printPackageJson,
  projectName,
} from './printers/next/print-package-json'
export { printTsconfig, tsconfigFileName } from './printers/next/print-tsconfig'
export { printReadme } from './printers/next/print-readme'
export { printNext } from './printers/next/print-next'
