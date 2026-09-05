import type { Locale } from './locales'

/**
 * A counted string, in the forms the locale actually has. English needs two and Russian needs three
 * (файл · файла · файлов), so the difference lives here rather than in each call site — ADR-360.
 *
 * `other` is mandatory because every locale has it; the rest are filled in per locale.
 */
export interface PluralForms {
  readonly one?: string
  readonly few?: string
  readonly many?: string
  readonly other: string
}

/** `{count}` in the chosen form is replaced with the number. */
export function formatPlural(locale: Locale, count: number, forms: PluralForms): string {
  const rule = new Intl.PluralRules(locale).select(count)
  const form = forms[rule as keyof PluralForms] ?? forms.other

  return form.replace('{count}', String(count))
}
