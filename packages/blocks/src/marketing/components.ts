import { BentoGrid } from './bento-grid/bento-grid'
import { ComparisonTable } from './comparison-table/comparison-table'
import { CtaBanner } from './cta-banner/cta-banner'
import { CtaSplit } from './cta-split/cta-split'
import { FaqAccordion } from './faq-accordion/faq-accordion'
import { FeatureGrid } from './feature-grid/feature-grid'
import { FeatureSplit } from './feature-split/feature-split'
import { LogoCloud } from './logo-cloud/logo-cloud'
import { NewsletterForm } from './newsletter-form/newsletter-form'
import { PricingTable } from './pricing-table/pricing-table'
import { TestimonialCard } from './testimonial-card/testimonial-card'
import { TestimonialMarquee } from './testimonial-marquee/testimonial-marquee'

/**
 * Every marketing block is loaded eagerly, and that is a measured decision rather than the default —
 * ADR-187. The content category moved two of nine into `lazy` because it bought 6 kB; here it buys
 * nothing. Measured off `app-build-manifest.json` (the method of ADR-152):
 *
 *   - all twelve eager: **286.7 kB**
 *   - `faq-accordion` lazy, the one block with an external dependency: **286.7 kB**
 *   - all twelve lazy: **286.9 kB**
 *
 * The components are not in the first chunk to begin with; the 4.3 kB these twelve blocks added to
 * `/studio` is their *metadata*, which the store fixes at creation (ADR-102) and no import boundary can
 * move. `lazy` would add twelve Suspense skeletons and a request each for no measured gain.
 */
export const components = {
  'feature-grid': FeatureGrid,
  'feature-split': FeatureSplit,
  'bento-grid': BentoGrid,
  'pricing-table': PricingTable,
  'testimonial-card': TestimonialCard,
  'testimonial-marquee': TestimonialMarquee,
  'logo-cloud': LogoCloud,
  'cta-banner': CtaBanner,
  'cta-split': CtaSplit,
  'faq-accordion': FaqAccordion,
  'comparison-table': ComparisonTable,
  'newsletter-form': NewsletterForm,
} as const
