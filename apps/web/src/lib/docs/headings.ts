import { plainText } from './frontmatter'

export interface DocHeading {
  readonly depth: number
  readonly text: string
  readonly slug: string
}

/**
 * `## 9. Decision discipline` → `decision-discipline`. The leading number goes: it is the section's
 * position, and a section that moves would otherwise change every link to it.
 */
export function slugify(text: string): string {
  const slug = plainText(text)
    .toLowerCase()
    .replace(/^\d+\.\s+/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug === '' ? 'section' : slug
}

/**
 * Anchors have to be unique on a page and heading text is not: `DECISIONS.md` has 311 sections
 * called "Question". The second occurrence becomes `question-2`, which is what a reader who pasted
 * the first link still lands on.
 */
export function createSlugger(): (text: string) => string {
  const used = new Map<string, number>()

  return (text) => {
    const base = slugify(text)
    const seen = used.get(base) ?? 0

    used.set(base, seen + 1)

    return seen === 0 ? base : `${base}-${seen + 1}`
  }
}
