import type { Metadata } from 'next'

import { getDictionary } from '../../../src/lib/i18n/dictionary'
import { DEFAULT_LOCALE, isLocale } from '../../../src/lib/i18n/locales'
import { setRequestLocale } from '../../../src/lib/i18n/request-locale'
import { alternatesFor } from '../../../src/lib/site'
import { LegalPage } from '../legal-page'

interface PrivacyPageProps {
  readonly params: Promise<{ readonly locale: string }>
}

export async function generateMetadata({ params }: PrivacyPageProps): Promise<Metadata> {
  const { locale } = await params
  const resolved = isLocale(locale) ? locale : DEFAULT_LOCALE
  const { legal } = getDictionary(resolved)

  return {
    title: legal.privacy.metaTitle,
    description: legal.privacy.metaDescription,
    alternates: alternatesFor(resolved, '/privacy'),
  }
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  const { locale } = await params
  const { legal } = getDictionary(setRequestLocale(locale))

  return <LegalPage copy={legal.privacy} />
}
