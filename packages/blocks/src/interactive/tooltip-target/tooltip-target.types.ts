import type { TooltipTargetProps as TooltipTargetSchemaProps } from './tooltip-target.schema'

/**
 * No slot, and ADR-202 is the reason: the description has to sit on the element that takes focus, and a block
 * cannot write an attribute into markup another block rendered.
 */
export type TooltipTargetProps = TooltipTargetSchemaProps
