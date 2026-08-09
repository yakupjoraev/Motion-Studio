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
export {
  ALIGNMENTS,
  MAX_WIDTH_SCALE,
  SPACE_PX,
  SPACE_SCALE,
  SURFACE_TOKENS,
  alignment,
  maxWidthScale,
  optionsFrom,
  spaceScale,
  surfaceToken,
  type Alignment,
  type MaxWidthScale,
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
