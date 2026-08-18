import { Children, type ReactNode } from 'react'

import { INTERACTIVE_BODY } from './interactive.styles'

/**
 * The slot half of ADR-206, in one place because four blocks need exactly this.
 *
 * `columns` established the pattern: read the host's children if they are there, fall back to the block's
 * own props if they are not. The reason it matters here is narrower than "flexibility" — a thumbnail render
 * passes **no children** (COMPONENT_LIBRARY.md § Thumbnails), so a panel that were empty without them would
 * ship an empty picture in the palette and `check:registry` would not notice.
 */
export function panelChildren(children: ReactNode): readonly ReactNode[] {
  return Children.toArray(children)
}

export interface PanelContentProps {
  /** The child that occupies this panel, if the host supplied one. */
  readonly child: ReactNode
  readonly body: string
}

export function PanelContent({ child, body }: PanelContentProps) {
  if (child !== undefined && child !== null) {
    return child
  }

  return body === '' ? null : <p className={INTERACTIVE_BODY}>{body}</p>
}
