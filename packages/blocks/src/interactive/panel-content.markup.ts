import { type MarkupChild, el, slot, txt } from '@motion-studio/schema'

import { INTERACTIVE_BODY } from './interactive.styles'

/**
 * The slot half of ADR-206 as markup: the block that was dropped into this panel if there is one, and
 * the panel's own text if there is not. The gate is the document's answer, resolved by `applyMarkup`
 * before any printer sees it — which is the same question `PanelContent` asks at render time.
 */
export const panelContentMarkup = (
  body: string,
  index: number,
  /** `timeline` writes its fallback in its own type scale, so the class is the caller's. */
  className: string = INTERACTIVE_BODY,
): readonly MarkupChild[] => [
  slot('children', index),
  ...(body === ''
    ? []
    : [
        el('p', {
          classNames: [className],
          slotGate: { slot: 'children', when: 'empty', index },
          children: [txt(body)],
        }),
      ]),
]
