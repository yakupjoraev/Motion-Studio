import { z } from 'zod'

import { headingLevel } from '../../marketing/marketing.schema'
import {
  ICON_NAME_MAX_LENGTH,
  NAV_LABEL_MAX_LENGTH,
  activeHrefField,
  navFrameFields,
  navLinkSchema,
} from '../navigation.schema'

export const MAX_SIDEBAR_GROUPS = 5
export const MAX_SIDEBAR_ITEMS = 8

/** An item carries a glyph, because the rail mode has room for nothing else. */
export const sidebarItemSchema = navLinkSchema.extend({
  icon: z.string().max(ICON_NAME_MAX_LENGTH).default('file'),
})

export type SidebarItem = z.infer<typeof sidebarItemSchema>

export const sidebarGroupSchema = z.object({
  title: z.string().min(1).max(NAV_LABEL_MAX_LENGTH).default('Getting started'),
  /** Ignored in rail mode: a 64 px rail has nowhere to put a disclosure or the title it discloses. */
  collapsible: z.boolean().default(false),
  items: z
    .array(sidebarItemSchema)
    .min(1)
    .max(MAX_SIDEBAR_ITEMS)
    .default([{ label: 'Overview', href: '#overview', icon: 'file' }]),
})

export type SidebarGroup = z.infer<typeof sidebarGroupSchema>

const DEFAULT_GROUPS: readonly SidebarGroup[] = [
  {
    title: 'Getting started',
    collapsible: false,
    items: [
      { label: 'Overview', href: '#overview', icon: 'file' },
      { label: 'Install', href: '#install', icon: 'download' },
      { label: 'First document', href: '#first', icon: 'hero' },
    ],
  },
  {
    title: 'Blocks',
    collapsible: true,
    items: [
      { label: 'Registry', href: '#registry', icon: 'grid' },
      { label: 'Layout', href: '#layout', icon: 'layout-rows' },
      { label: 'Marketing', href: '#marketing', icon: 'card' },
      { label: 'Navigation', href: '#navigation', icon: 'navbar' },
    ],
  },
  {
    title: 'Export',
    collapsible: true,
    items: [
      { label: 'React', href: '#react', icon: 'code' },
      { label: 'Next', href: '#next', icon: 'file' },
      { label: 'HTML', href: '#html', icon: 'export' },
    ],
  },
]

export const sidebarNavSchema = z.object({
  groups: z
    .array(sidebarGroupSchema)
    .min(1)
    .max(MAX_SIDEBAR_GROUPS)
    .default(DEFAULT_GROUPS.map((group) => ({ ...group, items: [...group.items] }))),
  /** The rail: glyphs only, names kept, and a label beside the glyph on hover *and* on focus. */
  collapsed: z.boolean().default(false),
  headingLevel,
  ...activeHrefField(),
  ...navFrameFields('Documentation'),
})

export type SidebarNavProps = z.infer<typeof sidebarNavSchema>
