import { children, defineMarkup, el, literal, txt } from '@motion-studio/schema'

import { iconMarkup } from '../../markup/icon'
import { controlStyles } from '../interactive.styles'
import { panelContentMarkup } from '../panel-content.markup'

import { PREVIEW_LABEL } from './modal-trigger.schema'
import {
  MODAL_BODY,
  MODAL_CLOSE,
  MODAL_DESCRIPTION,
  MODAL_FRAME,
  MODAL_FRAME_EMPTY,
  MODAL_FRAME_LABEL,
  MODAL_OVERLAY,
  MODAL_PREVIEW,
  MODAL_TITLE,
  modalContentStyles,
  modalRootStyles,
} from './modal-trigger.styles'
import type { ModalTriggerProps } from './modal-trigger.types'

/**
 * The dialog is inside the block's own frame here, exactly as ADR-205 has it on the canvas. The React
 * printer is what moves it to the document body on the way out, and it says so above the element.
 */
export const modalTriggerMarkup = defineMarkup<ModalTriggerProps>(
  ({
    props: {
      triggerLabel,
      triggerVariant,
      triggerSize,
      title,
      description,
      body,
      closeLabel,
      size,
      defaultOpen,
      hidden,
    },
    id,
  }) => {
    const contentId = `${id}-dialog`
    const titleId = `${id}-title`
    const descriptionId = `${id}-description`

    return el('div', {
      classNames: [modalRootStyles({ hidden })],
      children: [
        el('button', {
          classNames: [controlStyles({ variant: triggerVariant, size: triggerSize })],
          attributes: {
            type: literal('button'),
            'aria-haspopup': literal('dialog'),
            'aria-expanded': literal(defaultOpen),
            ...(defaultOpen ? { 'aria-controls': literal(contentId) } : {}),
            'data-state': literal(defaultOpen ? 'open' : 'closed'),
          },
          children: [txt(triggerLabel)],
        }),
        el('div', {
          classNames: [MODAL_PREVIEW],
          children: [
            el('p', { classNames: [MODAL_FRAME_LABEL], children: [txt(PREVIEW_LABEL)] }),
            el('div', {
              classNames: [MODAL_FRAME],
              children: children(
                el('p', { classNames: [MODAL_FRAME_EMPTY], children: [txt(title)] }),
                defaultOpen &&
                  el('div', {
                    classNames: [MODAL_OVERLAY],
                    attributes: { 'data-state': literal('open') },
                  }),
                defaultOpen &&
                  el('div', {
                    classNames: [modalContentStyles({ size })],
                    attributes: {
                      role: literal('dialog'),
                      id: literal(contentId),
                      'data-state': literal('open'),
                      tabIndex: literal(-1),
                      'aria-describedby': literal(descriptionId),
                      'aria-labelledby': literal(titleId),
                    },
                    children: [
                      el('h2', {
                        classNames: [MODAL_TITLE],
                        attributes: { id: literal(titleId) },
                        children: [txt(title)],
                      }),
                      el('p', {
                        classNames: [MODAL_DESCRIPTION],
                        attributes: { id: literal(descriptionId) },
                        children: [txt(description)],
                      }),
                      el('div', {
                        classNames: [MODAL_BODY],
                        children: panelContentMarkup(body, 0),
                      }),
                      el('button', {
                        classNames: [MODAL_CLOSE],
                        attributes: {
                          type: literal('button'),
                          'aria-label': literal(closeLabel),
                        },
                        children: children(iconMarkup({ name: 'x', size: 18 })),
                      }),
                    ],
                  }),
              ),
            }),
          ],
        }),
      ],
    })
  },
)
