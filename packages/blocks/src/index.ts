export { defineBlock } from './define-block'
export type {
  ControlPath,
  DefineBlockConfig,
  TypedControl,
  TypedControlGroup,
} from './define-block.types'
export { DEFINITIONS, blockRegistry } from './registry'
export {
  PARITY_CODE,
  RegistryParityError,
  assertRegistryParity,
  registryParity,
  renderRegistry,
  type BlockComponent,
} from './render-registry'
export { prefersReducedMotion } from './reduced-motion'
export {
  ALIGNMENTS,
  MAX_WIDTH_SCALE,
  MIN_HEIGHT_CLASS,
  MIN_HEIGHT_SCALE,
  SPACE_PX,
  SPACE_SCALE,
  SURFACE_TOKENS,
  VISIBILITY_CLASS,
  alignment,
  maxWidthScale,
  minHeightScale,
  optionsFrom,
  spaceScale,
  surfaceToken,
  visibility,
  type Alignment,
  type MaxWidthScale,
  type MinHeightScale,
  type SpaceScale,
  type SurfaceToken,
} from './scales'

// The blocks themselves. The category maps stay internal: two of them export a `definitions` each,
// and a barrel that re-exported both would have to rename one of them for no one's benefit.
export {
  MIN_HEIGHTS,
  Section,
  sectionDefinition,
  sectionInnerStyles,
  sectionMotion,
  sectionSchema,
  sectionStyles,
  type SectionMinHeight,
  type SectionProps,
} from './layout/section/index'
export {
  CONTAINER_ALIGN,
  CONTAINER_JUSTIFY,
  Container,
  DIRECTIONS,
  containerDefinition,
  containerMotion,
  containerSchema,
  containerStyles,
  type ContainerAlign,
  type ContainerDirection,
  type ContainerJustify,
  type ContainerProps,
} from './layout/container/index'
export {
  HEADING_MAX_LENGTH,
  HEADING_SIZES,
  HEADING_WEIGHTS,
  Heading,
  TRACKING,
  headingDefinition,
  headingMotion,
  headingSchema,
  headingStyles,
  type HeadingProps,
  type HeadingSize,
  type HeadingTracking,
  type HeadingWeight,
} from './content/heading/index'

/*
 * The hero category. Reached through each block's own `index` rather than through the category one,
 * for the reason above: a category index exports a `definitions` and a `components`, and three of
 * those would collide here. The shared copy stack is exported too — a later category that wants the
 * same rhythm should use it rather than transcribe it (ADR-118).
 */
export {
  HERO_COPY_CONTROLS,
  HERO_FRAME_CONTROLS,
  HERO_TRUST_CONTROL,
  HeroCopy,
  heroEntrance,
  heroMotion,
  heroSectionStyles,
  type Cta,
  type CtaVariant,
  type EyebrowStyle,
  type HeroCopyProps,
  type HeroCopyShape,
  type HeroFrameShape,
  type HeroTrustShape,
  type TrustItem,
} from './hero/index'
export * from './hero/hero-centered/index'
export * from './hero/hero-split/index'
export * from './hero/hero-aurora/index'
export * from './hero/hero-video/index'
export * from './hero/hero-terminal/index'
export * from './hero/hero-app-preview/index'
