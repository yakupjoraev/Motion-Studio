import type { ReactNode } from 'react'

import type { ModalTriggerProps as ModalTriggerSchemaProps } from './modal-trigger.schema'

/** The children are the dialog's content; its `body` text stands in until one arrives — ADR-206. */
export interface ModalTriggerProps extends ModalTriggerSchemaProps {
  readonly children?: ReactNode
}
