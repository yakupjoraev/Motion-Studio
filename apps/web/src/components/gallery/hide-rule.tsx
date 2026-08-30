'use client'

export interface HideRuleProps {
  /** The ids that survive the filter. */
  readonly ids: ReadonlySet<string>
  /** The categories that still have a card under them. */
  readonly sections: ReadonlySet<string>
  readonly total: number
}

/**
 * The filter, as one stylesheet.
 *
 * `display: none` and not a `hidden` attribute set from JavaScript: the cards belong to the server,
 * so there is no React tree here to re-render, and walking the DOM to set attributes on 72 elements
 * would be React's job done by hand and worse. A rule the browser applies is one style recalculation
 * for the whole grid.
 *
 * It also takes the cards out of the accessibility tree and out of the tab order, which is what a
 * filtered-out card should be — an `aria-hidden` card that still focuses is the version of this that
 * looks right and traps a keyboard.
 */
export function HideRule({ ids, sections, total }: HideRuleProps) {
  if (ids.size === total) {
    return null
  }

  const kept = [...ids].map((id) => `[data-block-card="${id}"]`).join(',')
  const shown = [...sections].map((id) => `[data-block-section="${id}"]`).join(',')

  const css = [
    '[data-block-card]{display:none}',
    kept === '' ? '' : `${kept}{display:block}`,
    '[data-block-section]{display:none}',
    shown === '' ? '' : `${shown}{display:block}`,
  ]
    .filter((rule) => rule !== '')
    .join('')

  // biome-ignore lint/security/noDangerouslySetInnerHtml: a stylesheet is text, and its every character is built from registry ids above
  return <style dangerouslySetInnerHTML={{ __html: css }} />
}
