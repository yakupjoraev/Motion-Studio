import { bentoGridDefinition } from './bento-grid/bento-grid.definition'
import { comparisonTableDefinition } from './comparison-table/comparison-table.definition'
import { ctaBannerDefinition } from './cta-banner/cta-banner.definition'
import { ctaSplitDefinition } from './cta-split/cta-split.definition'
import { faqAccordionDefinition } from './faq-accordion/faq-accordion.definition'
import { featureGridDefinition } from './feature-grid/feature-grid.definition'
import { featureSplitDefinition } from './feature-split/feature-split.definition'
import { logoCloudDefinition } from './logo-cloud/logo-cloud.definition'
import { newsletterFormDefinition } from './newsletter-form/newsletter-form.definition'
import { pricingTableDefinition } from './pricing-table/pricing-table.definition'
import { testimonialCardDefinition } from './testimonial-card/testimonial-card.definition'
import { testimonialMarqueeDefinition } from './testimonial-marquee/testimonial-marquee.definition'

// COMPONENT_LIBRARY.md § Catalogue (Marketing), which is the order the palette groups them in.
export const definitions = {
  'feature-grid': featureGridDefinition,
  'feature-split': featureSplitDefinition,
  'bento-grid': bentoGridDefinition,
  'pricing-table': pricingTableDefinition,
  'testimonial-card': testimonialCardDefinition,
  'testimonial-marquee': testimonialMarqueeDefinition,
  'logo-cloud': logoCloudDefinition,
  'cta-banner': ctaBannerDefinition,
  'cta-split': ctaSplitDefinition,
  'faq-accordion': faqAccordionDefinition,
  'comparison-table': comparisonTableDefinition,
  'newsletter-form': newsletterFormDefinition,
} as const
