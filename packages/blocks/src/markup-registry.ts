import type { MarkupRegistry } from '@motion-studio/schema'

import { badgeMarkup } from './content/badge/badge.markup'
import { codeBlockMarkup } from './content/code-block/code-block.markup'
import { headingMarkup } from './content/heading/heading.markup'
import { imageMarkup } from './content/image/image.markup'
import { quoteMarkup } from './content/quote/quote.markup'
import { richTextMarkup } from './content/rich-text/rich-text.markup'
import { statMarkup } from './content/stat/stat.markup'
import { textMarkup } from './content/text/text.markup'
import { videoMarkup } from './content/video/video.markup'
import { chartPreviewMarkup } from './data/chart-preview/chart-preview.markup'
import { progressRingMarkup } from './data/progress-ring/progress-ring.markup'
import { statGridMarkup } from './data/stat-grid/stat-grid.markup'
import { tableMarkup } from './data/table/table.markup'
import { timelineMarkup } from './data/timeline/timeline.markup'
import { auroraBackgroundMarkup } from './effects/aurora-background/aurora-background.markup'
import { beamsMarkup } from './effects/beams/beams.markup'
import { borderBeamMarkup } from './effects/border-beam/border-beam.markup'
import { dotGridMarkup } from './effects/dot-grid/dot-grid.markup'
import { glowMarkup } from './effects/glow/glow.markup'
import { grainOverlayMarkup } from './effects/grain-overlay/grain-overlay.markup'
import { gridLinesMarkup } from './effects/grid-lines/grid-lines.markup'
import { meshGradientMarkup } from './effects/mesh-gradient/mesh-gradient.markup'
import { noiseOverlayMarkup } from './effects/noise-overlay/noise-overlay.markup'
import { particlesMarkup } from './effects/particles/particles.markup'
import { scanlinesMarkup } from './effects/scanlines/scanlines.markup'
import { shineMarkup } from './effects/shine/shine.markup'
import { spotlightMarkup } from './effects/spotlight/spotlight.markup'
import { checkboxFieldMarkup } from './forms/checkbox-field/checkbox-field.markup'
import { contactFormMarkup } from './forms/contact-form/contact-form.markup'
import { inputFieldMarkup } from './forms/input-field/input-field.markup'
import { selectFieldMarkup } from './forms/select-field/select-field.markup'
import { waitlistFormMarkup } from './forms/waitlist-form/waitlist-form.markup'
import { heroAppPreviewMarkup } from './hero/hero-app-preview/hero-app-preview.markup'
import { heroAuroraMarkup } from './hero/hero-aurora/hero-aurora.markup'
import { heroCenteredMarkup } from './hero/hero-centered/hero-centered.markup'
import { heroSplitMarkup } from './hero/hero-split/hero-split.markup'
import { heroTerminalMarkup } from './hero/hero-terminal/hero-terminal.markup'
import { heroVideoMarkup } from './hero/hero-video/hero-video.markup'
import { accordionMarkup } from './interactive/accordion/accordion.markup'
import { buttonGroupMarkup } from './interactive/button-group/button-group.markup'
import { buttonMarkup } from './interactive/button/button.markup'
import { carouselMarkup } from './interactive/carousel/carousel.markup'
import { commandMenuPreviewMarkup } from './interactive/command-menu-preview/command-menu-preview.markup'
import { modalTriggerMarkup } from './interactive/modal-trigger/modal-trigger.markup'
import { tabsMarkup } from './interactive/tabs/tabs.markup'
import { themeToggleMarkup } from './interactive/theme-toggle/theme-toggle.markup'
import { tooltipTargetMarkup } from './interactive/tooltip-target/tooltip-target.markup'
import { columnsMarkup } from './layout/columns/columns.markup'
import { containerMarkup } from './layout/container/container.markup'
import { dividerMarkup } from './layout/divider/divider.markup'
import { gridMarkup } from './layout/grid/grid.markup'
import { sectionMarkup } from './layout/section/section.markup'
import { spacerMarkup } from './layout/spacer/spacer.markup'
import { stackMarkup } from './layout/stack/stack.markup'
import { bentoGridMarkup } from './marketing/bento-grid/bento-grid.markup'
import { comparisonTableMarkup } from './marketing/comparison-table/comparison-table.markup'
import { ctaBannerMarkup } from './marketing/cta-banner/cta-banner.markup'
import { ctaSplitMarkup } from './marketing/cta-split/cta-split.markup'
import { faqAccordionMarkup } from './marketing/faq-accordion/faq-accordion.markup'
import { featureGridMarkup } from './marketing/feature-grid/feature-grid.markup'
import { featureSplitMarkup } from './marketing/feature-split/feature-split.markup'
import { logoCloudMarkup } from './marketing/logo-cloud/logo-cloud.markup'
import { newsletterFormMarkup } from './marketing/newsletter-form/newsletter-form.markup'
import { pricingTableMarkup } from './marketing/pricing-table/pricing-table.markup'
import { testimonialCardMarkup } from './marketing/testimonial-card/testimonial-card.markup'
import { testimonialMarqueeMarkup } from './marketing/testimonial-marquee/testimonial-marquee.markup'
import { breadcrumbsMarkup } from './navigation/breadcrumbs/breadcrumbs.markup'
import { dockMarkup } from './navigation/dock/dock.markup'
import { footerMarkup } from './navigation/footer/footer.markup'
import { navbarFloatingMarkup } from './navigation/navbar-floating/navbar-floating.markup'
import { navbarMarkup } from './navigation/navbar/navbar.markup'
import { sidebarNavMarkup } from './navigation/sidebar-nav/sidebar-nav.markup'

/**
 * What each block exports as — ADR-249, injected into `buildIR` for ADR-226's reason: it lives here
 * and `codegen` may not import this package.
 *
 * It is a registry of **code** rather than a field on the descriptor, which stays data. That is the
 * distinction ADR-225 drew and `registry.node.test.ts` guards: a producer calls its block's `cva`, and
 * a `.styles.ts` module has no business in the metadata half of the registry.
 *
 * A block absent from this map exports as its root element alone, which is what every block did before
 * producers existed. `registry.markup.test.tsx` compares each producer's DOM with its component's, and
 * prompt 45c is where the last entry lands and the absence becomes an error.
 */
export const markupRegistry: MarkupRegistry = {
  accordion: accordionMarkup,
  'aurora-background': auroraBackgroundMarkup,
  badge: badgeMarkup,
  beams: beamsMarkup,
  'bento-grid': bentoGridMarkup,
  'border-beam': borderBeamMarkup,
  breadcrumbs: breadcrumbsMarkup,
  button: buttonMarkup,
  'button-group': buttonGroupMarkup,
  carousel: carouselMarkup,
  'chart-preview': chartPreviewMarkup,
  'checkbox-field': checkboxFieldMarkup,
  'code-block': codeBlockMarkup,
  columns: columnsMarkup,
  'command-menu-preview': commandMenuPreviewMarkup,
  'comparison-table': comparisonTableMarkup,
  'contact-form': contactFormMarkup,
  container: containerMarkup,
  'cta-banner': ctaBannerMarkup,
  'cta-split': ctaSplitMarkup,
  divider: dividerMarkup,
  dock: dockMarkup,
  'dot-grid': dotGridMarkup,
  'faq-accordion': faqAccordionMarkup,
  'feature-grid': featureGridMarkup,
  'feature-split': featureSplitMarkup,
  footer: footerMarkup,
  glow: glowMarkup,
  'grain-overlay': grainOverlayMarkup,
  grid: gridMarkup,
  'grid-lines': gridLinesMarkup,
  heading: headingMarkup,
  'hero-app-preview': heroAppPreviewMarkup,
  'hero-aurora': heroAuroraMarkup,
  'hero-centered': heroCenteredMarkup,
  'hero-split': heroSplitMarkup,
  'hero-terminal': heroTerminalMarkup,
  'hero-video': heroVideoMarkup,
  image: imageMarkup,
  'input-field': inputFieldMarkup,
  'logo-cloud': logoCloudMarkup,
  'mesh-gradient': meshGradientMarkup,
  'modal-trigger': modalTriggerMarkup,
  navbar: navbarMarkup,
  'navbar-floating': navbarFloatingMarkup,
  'newsletter-form': newsletterFormMarkup,
  'noise-overlay': noiseOverlayMarkup,
  particles: particlesMarkup,
  'pricing-table': pricingTableMarkup,
  'progress-ring': progressRingMarkup,
  quote: quoteMarkup,
  'rich-text': richTextMarkup,
  scanlines: scanlinesMarkup,
  section: sectionMarkup,
  'select-field': selectFieldMarkup,
  shine: shineMarkup,
  'sidebar-nav': sidebarNavMarkup,
  spacer: spacerMarkup,
  spotlight: spotlightMarkup,
  stack: stackMarkup,
  stat: statMarkup,
  'stat-grid': statGridMarkup,
  table: tableMarkup,
  tabs: tabsMarkup,
  'testimonial-card': testimonialCardMarkup,
  'testimonial-marquee': testimonialMarqueeMarkup,
  text: textMarkup,
  'theme-toggle': themeToggleMarkup,
  timeline: timelineMarkup,
  'tooltip-target': tooltipTargetMarkup,
  video: videoMarkup,
  'waitlist-form': waitlistFormMarkup,
}
