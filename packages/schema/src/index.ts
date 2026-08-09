export {
  ASSET_ID_RE,
  CATALOGUE_ID_RE,
  DOCUMENT_ID_RE,
  EFFECT_INSTANCE_ID_RE,
  ID_CODES,
  InvalidIdError,
  NODE_ID_RE,
  assetId,
  assetIdSchema,
  blockId,
  blockIdSchema,
  documentIdSchema,
  effectId,
  effectIdSchema,
  effectInstanceIdSchema,
  nodeId,
  nodeIdSchema,
  type AssetId,
  type BlockId,
  type EffectId,
  type NodeId,
} from './ids/ids'

export {
  BREAKPOINTS,
  CASCADE_ORDER,
  breakpointIdSchema,
  isBreakpointId,
  type Breakpoint,
  type BreakpointId,
} from './breakpoints/breakpoints'
export { resolveResponsiveProps, type ResponsiveSource } from './breakpoints/resolve'

export type {
  MotionChannel,
  MotionSpec,
  MotionStagger,
  MotionTrigger,
  MotionTriggerKind,
} from './motion/motion.types'
export {
  motionChannelSchema,
  motionSpecSchema,
  motionStaggerSchema,
  motionTriggerSchema,
} from './motion/motion.schema'

export { BLEND_MODES, type BlendMode, type EffectInstance } from './effects/effects.types'
export { blendModeSchema, effectInstanceSchema } from './effects/effects.schema'

export type {
  Asset,
  AssetKind,
  AssetSource,
  DocumentCanvas,
  DocumentMeta,
  MotionDocument,
  Node,
  UnknownDocument,
} from './document/document.types'
export {
  assetSchema,
  assetSourceSchema,
  documentCanvasSchema,
  documentMetaSchema,
  documentSchema,
  nodeSchema,
  versionProbeSchema,
} from './document/document.schema'
export {
  ROOT_BLOCK_ID,
  ROOT_SLOT,
  createEmptyDocument,
  type CreateEmptyOptions,
} from './document/create-empty'
export {
  DOCUMENT_ERROR_CODES,
  validateDocument,
  validateProps,
  type DocumentError,
  type DocumentErrorCode,
  type PropValidationReport,
  type ValidateOptions,
} from './document/validate'
export {
  REPAIR_KINDS,
  repairDocument,
  type Repair,
  type RepairKind,
  type RepairOptions,
  type RepairOutcome,
} from './document/repair'
export {
  ancestors,
  descendants,
  documentOrderIndex,
  isDescendant,
  nodeIds,
  reachableIds,
  walk,
} from './document/traverse'
export { serializeDocument, withStableKeyOrder } from './document/serialize'

export {
  BLOCK_CATEGORIES,
  CONTROL_KINDS,
  type A11yNotes,
  type BlockCapabilities,
  type BlockCategory,
  type BlockDefinition,
  type BlockRegistry,
  type CodegenDescriptor,
  type ControlDescriptor,
  type ControlGroup,
  type ControlKind,
  type ImportSpec,
  type RenderRegistry,
  type SlotDefinition,
  type UnknownProps,
} from './registry/registry.types'
export {
  DuplicateBlockError,
  REGISTRY_CODES,
  UnknownBlockError,
  createRegistry,
} from './registry/create-registry'

export {
  MAX_NAME_LENGTH,
  MAX_TEXT_LENGTH,
  REMOVAL_KINDS,
  sanitizeDocument,
  type Removal,
  type RemovalKind,
  type SanitizeOutcome,
} from './sanitize/sanitize'
export { sanitizeRichText } from './sanitize/rich-text'
/*
 * The AST is the *stored* form of rich text (ADR-122); the string sanitiser above stays for the
 * `html`-keyed props FILE_FORMAT.md § Security already covers, and the two share one policy.
 */
export {
  MAX_BLOCKS,
  MAX_CHILDREN,
  MAX_HREF_LENGTH,
  MAX_LIST_ITEMS,
  MAX_RUN_LENGTH,
  RICH_TEXT_MARKS,
  parseRichText,
  richTextBlockSchema,
  richTextDocumentSchema,
  richTextInlineSchema,
  richTextLinkSchema,
  richTextParagraphSchema,
  richTextRunSchema,
  richTextToHtml,
  type RichTextBlock,
  type RichTextDocument,
  type RichTextInline,
  type RichTextLink,
  type RichTextList,
  type RichTextListItem,
  type RichTextMark,
  type RichTextParagraph,
  type RichTextRun,
} from './rich-text/index'
export {
  ALLOWED_IMAGE_TYPES,
  ALLOWED_SCHEMES,
  MAX_BLUR_DATA_URL_BYTES,
  MAX_DATA_URL_BYTES,
  checkImageDataUrl,
  isSafeUrl,
  type DataUrlCheck,
} from './sanitize/urls'
export {
  validateCssDeclaration,
  validateCssValue,
  type CssDeclaration,
  type CssRejection,
} from './sanitize/css/validate-css'
export { CSS_BLOCKLIST, findBlockedConstructs, type BlocklistEntry } from './sanitize/css/blocklist'

export {
  CURRENT_VERSION,
  MIGRATION_CODES,
  MigrationError,
  migrateDocument,
  migrations,
  type Migration,
  type MigrationCode,
} from './migrations/index'

// The factories ship with the package because every downstream test builds its fixtures from them —
// TESTING.md § Determinism. They are tree-shaken out of anything that does not import them.
export {
  doc,
  fakeRegistry,
  fixtureBlockId,
  nextNodeId,
  node,
  resetFactories,
  tree,
  treeId,
} from './test/factories'
