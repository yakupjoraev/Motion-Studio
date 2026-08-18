import type { ReactNode } from 'react'

import type { TabsProps as TabsSchemaProps } from './tabs.schema'

/**
 * The children are the panels, positionally: child `i` fills panel `i`, and an item with no child renders its
 * own `body` text instead — ADR-206, which exists because a thumbnail render passes no children at all.
 */
export interface TabsProps extends TabsSchemaProps {
  readonly children?: ReactNode
}
