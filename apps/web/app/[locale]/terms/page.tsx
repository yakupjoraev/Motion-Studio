import type { Metadata } from 'next'

import { getDictionary } from '../../../src/lib/i18n/dictionary'
import { DEFAULT_LOCALE, isLocale } from '../../../src/lib/i18n/locales'
import { setRequestLocale } from '../../../src/lib/i18n/request-locale'
import { alternatesFor } from '../../../src/lib/site'
import { LegalPage } from '../legal-page'

interface TermsPageProps {
  readonly params: Promise<{ readonly locale: string }>
}

export async function generateMetadata({ params }: TermsPageProps): Promise<Metadata> {
  const { locale } = await params
  const resolved = isLocale(locale) ? locale : DEFAULT_LOCALE
  const { legal } = getDictionary(resolved)

  return {
    title: legal.terms.metaTitle,
    description: legal.terms.metaDescription,
    alternates: alternatesFor(resolved, '/terms'),
  }
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params
  const { legal } = getDictionary(setRequestLocale(locale))

  return <LegalPage copy={legal.terms} />
}
