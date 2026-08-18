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
export * from './content/heading/index'
export * from './content/text/index'
export * from './content/rich-text/index'
export * from './content/image/index'
export * from './content/video/index'
export * from './content/code-block/index'
export * from './content/quote/index'
export * from './content/stat/index'
export * from './content/badge/index'

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

/*
 * The marketing category, through each block's own index for the reason the hero category gives — the
 * category barrel exports a `definitions` and a `components`, and twelve of those would collide here. The
 * shared vocabulary is exported too: a later category that wants the same section rhythm, card surface or
 * nested-radius arithmetic should use it rather than transcribe it.
 */
export {
  ACTION_VARIANTS,
  ALT_MAX_LENGTH,
  BODY_MAX_LENGTH,
  CARD_TREATMENTS,
  DESCRIPTION_MAX_LENGTH,
  HEADING_LEVELS,
  HEADING_TAGS,
  MARQUEE_MAX_DURATION,
  MARQUEE_MIN_DURATION,
  MAX_ACTIONS,
  TESTIMONIAL_ATTRIBUTION_MAX_LENGTH,
  TESTIMONIAL_QUOTE_MAX_LENGTH,
  TITLE_MAX_LENGTH,
  actionSchema,
  cardTreatment,
  headingLevel,
  mediaSchema,
  nextHeadingLevel,
  sectionCopyFields,
  sectionFrameFields,
  type Action,
  type ActionVariant,
  type CardTreatment,
  type HeadingLevel,
  type Media,
  type SectionCopyDefaults,
  type SectionCopyShape,
  type SectionFrameShape,
} from './marketing/marketing.schema'
export {
  SECTION_COPY_CONTROLS,
  SECTION_FRAME_CONTROLS,
  sectionCopyGroup,
} from './marketing/marketing.controls'
export {
  MARKETING_FOCUS,
  MARKETING_INNER,
  MARKETING_TRANSITION,
  actionRowStyles,
  actionStyles,
  marketingSectionStyles,
  sectionHeadingStyles,
} from './marketing/marketing.styles'
export { CARD_RADIUS, cardStyles } from './marketing/card.styles'
export { MARQUEE_ROWS, marqueeRowStyles } from './marketing/marquee.styles'
export {
  RADIUS_CLASS,
  innerRadiusClass,
  innerRadiusToken,
  radiusPx,
} from './marketing/nested-radius'
export { ActionButton } from './marketing/action-button'
export { MarketingSection } from './marketing/marketing-section'
export { MarqueeRow } from './marketing/marquee-row'
export { MarqueeStyles } from './marketing/marquee-styles'
export { MediaFrame } from './marketing/media-frame'
export { SectionHeader } from './marketing/section-header'
export { SectionHeading } from './marketing/section-heading'
export {
  cardHover,
  marketingCardMotion,
  marketingEntrance,
  marketingMotion,
} from './marketing/marketing.motion'
export * from './marketing/feature-grid/index'
export * from './marketing/feature-split/index'
export * from './marketing/bento-grid/index'
export * from './marketing/pricing-table/index'
export * from './marketing/testimonial-card/index'
export * from './marketing/testimonial-marquee/index'
export * from './marketing/logo-cloud/index'
export * from './marketing/cta-banner/index'
export * from './marketing/cta-split/index'
export * from './marketing/faq-accordion/index'
export * from './marketing/comparison-table/index'
export * from './marketing/newsletter-form/index'

/*
 * The navigation category, through each block's own index for the reason the two before it give — a
 * category barrel exports a `definitions` and a `components`, and three of those would collide here. The
 * shared vocabulary is exported too: the link shapes, the one place `aria-current` is decided, the drawer
 * two of the bars open, and the hook that turns the shared scroll bus into a class.
 *
 * `NavLink` is a component here and a shape in the schema, so the shape is aliased. One name, two
 * declaration spaces, and a barrel is the one place that has to choose.
 */
export {
  BRAND_MAX_LENGTH,
  CLOSE_MENU_LABEL,
  ICON_NAME_MAX_LENGTH,
  MAX_NAV_CHILDREN,
  MAX_NAV_ITEMS,
  MAX_SOCIALS,
  NAV_DESCRIPTION_MAX_LENGTH,
  NAV_LABEL_MAX_LENGTH,
  OPEN_MENU_LABEL,
  activeHrefField,
  brandFields,
  isActiveHref,
  navChildSchema,
  navFrameFields,
  navItemSchema,
  navLinkSchema,
  socialAccessibleName,
  socialSchema,
  type ActiveShape,
  type BrandShape,
  type NavChild,
  type NavItem,
  type NavLink as NavLinkShape,
  type NavFrameShape,
  type Social,
} from './navigation/navigation.schema'
export {
  ACTIVE_HREF_CONTROL,
  NAV_ACTION_ITEM_CONTROLS,
  NAV_BRAND_CONTROLS,
  NAV_FRAME_CONTROLS,
  NAV_ITEM_CONTROLS,
  NAV_LINK_ITEM_CONTROLS,
  SOCIAL_ITEM_CONTROLS,
} from './navigation/navigation.controls'
export {
  NAV_BRAND,
  NAV_FOCUS,
  NAV_GROUP_HEADING,
  NAV_ICON_BUTTON,
  NAV_INNER,
  NAV_PANEL_DESCRIPTION,
  NAV_TOOLTIP,
  NAV_TRANSITION,
  SKIP_LINK,
  navActionStyles,
  navLinkStyles,
} from './navigation/navigation.styles'
export {
  footerMotion as navFooterMotion,
  navEntrance,
  navMotion,
} from './navigation/navigation.motion'
export { NavAction } from './navigation/nav-action'
export { NavDrawer } from './navigation/nav-drawer'
export { NavIcon } from './navigation/nav-icon'
export { NavLink } from './navigation/nav-link'
export { useScrolled } from './navigation/use-scrolled'
export * from './navigation/navbar/index'
export * from './navigation/navbar-floating/index'
export * from './navigation/sidebar-nav/index'
export * from './navigation/footer/index'
export * from './navigation/breadcrumbs/index'
export * from './navigation/dock/index'

/*
 * The interactive category, through each block's own index for the reason the three before it give — a category
 * barrel exports a `definitions` and a `components`, and four of those would collide here. The shared vocabulary
 * goes with it: the control geometry every block in the category is drawn from, the panel fallback that keeps a
 * slotted block complete without children (ADR-206), and the glyph-by-name renderer six of them use.
 */
export {
  ARIA_LABEL_MAX_LENGTH as INTERACTIVE_ARIA_LABEL_MAX_LENGTH,
  BODY_MAX_LENGTH as PANEL_BODY_MAX_LENGTH,
  CONTROL_SIZES,
  CONTROL_VARIANTS,
  ICON_NAME_MAX_LENGTH as CONTROL_ICON_NAME_MAX_LENGTH,
  LABEL_MAX_LENGTH as CONTROL_LABEL_MAX_LENGTH,
  controlSize,
  controlVariant,
  iconNameField,
  interactiveFrameFields,
  labelledFrameFields,
  panelItemSchema,
  type ControlSize,
  type ControlVariant,
  type InteractiveFrameShape,
  type LabelledFrameShape,
  type PanelItem,
} from './interactive/interactive.schema'
export {
  INTERACTIVE_FRAME_CONTROLS,
  LABELLED_FRAME_CONTROLS,
  PANEL_ITEM_CONTROLS,
  SIZE_CONTROL,
  VARIANT_CONTROL,
  panelItemTemplate,
} from './interactive/interactive.controls'
export {
  ICON_CONTROL,
  ICON_SIZE,
  INTERACTIVE_BODY,
  INTERACTIVE_FOCUS,
  INTERACTIVE_HEADING,
  INTERACTIVE_PANEL,
  INTERACTIVE_TRANSITION,
  controlStyles,
} from './interactive/interactive.styles'
export {
  controlHover,
  controlMotion,
  interactiveEntrance,
  interactiveMotion,
} from './interactive/interactive.motion'
export { ControlIcon, type ControlIconProps } from './interactive/control-icon'
export { PanelContent, panelChildren, type PanelContentProps } from './interactive/panel-content'
export * from './interactive/button/index'
export * from './interactive/button-group/index'
export * from './interactive/tabs/index'
export * from './interactive/accordion/index'
export * from './interactive/carousel/index'
export * from './interactive/modal-trigger/index'
export * from './interactive/tooltip-target/index'
export * from './interactive/command-menu-preview/index'
export * from './interactive/theme-toggle/index'

/*
 * The effects category, through its own barrel: thirteen blocks plus the stack that mounts them on a
 * node, and the shared vocabulary every one of them is built from.
 */
export * from './effects/index'
