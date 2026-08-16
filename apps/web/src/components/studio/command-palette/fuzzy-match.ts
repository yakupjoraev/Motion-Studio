/**
 * SHORTCUTS.md § Command palette: "fuzzy match on label + keywords, scoring by consecutive-character
 * runs and word-boundary hits". Those two rules are the whole design, and they are what makes
 * "ins her" find "Insert Hero" above "Insert Header" — the second word's match starts a word in one
 * and sits mid-word in the other.
 *
 * Returns `null` for no match rather than 0, so a caller cannot confuse "matched badly" with "did
 * not match".
 */
const RUN_BONUS = 8
const BOUNDARY_BONUS = 12
const START_BONUS = 10
/** Every unmatched character costs a little, so a short label beats a long one at equal quality. */
const LENGTH_PENALTY = 0.4

const isBoundary = (haystack: string, index: number): boolean =>
  index === 0 || /[\s\-_/.]/.test(haystack.charAt(index - 1))

/** One term against one string. Greedy left-to-right, which is what a user's typing implies. */
function scoreTerm(haystack: string, term: string): number | null {
  if (term === '') {
    return 0
  }

  let score = 0
  let cursor = 0
  let run = 0

  for (const character of term) {
    const found = haystack.indexOf(character, cursor)

    if (found === -1) {
      return null
    }

    if (found === cursor && cursor > 0) {
      run += 1
      score += RUN_BONUS * run
    } else {
      run = 0
    }

    if (isBoundary(haystack, found)) {
      score += found === 0 ? START_BONUS + BOUNDARY_BONUS : BOUNDARY_BONUS
    }

    score += 1
    cursor = found + 1
  }

  return score
}

export interface FuzzyTarget {
  readonly label: string
  readonly keywords?: readonly string[]
}

/**
 * A query is split on whitespace and every term has to match *something* — the label or a keyword.
 * That is what lets "ins her" work: `ins` matches "insert", `her` matches "hero", and neither has to
 * be a substring of the other.
 */
export function fuzzyScore(target: FuzzyTarget, query: string): number | null {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean)

  if (terms.length === 0) {
    return 0
  }

  const label = target.label.toLowerCase()
  const keywords = (target.keywords ?? []).map((keyword) => keyword.toLowerCase())
  let total = 0

  for (const term of terms) {
    const labelScore = scoreTerm(label, term)
    // A keyword hit is worth less than a label hit: the label is what the user is reading.
    const keywordScore = keywords.reduce<number | null>((best, keyword) => {
      const score = scoreTerm(keyword, term)

      return score === null ? best : Math.max(best ?? 0, score * 0.6)
    }, null)

    if (labelScore === null && keywordScore === null) {
      return null
    }

    total += Math.max(labelScore ?? 0, keywordScore ?? 0)
  }

  return total - target.label.length * LENGTH_PENALTY
}
