import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { render } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { ICON_GEOMETRY } from './geometry'
import { ICON_NAMES, type IconName } from './icon-name'
import { ICON_REGISTRY } from './registry'

/**
 * The groups `prompts/07-icons.md` § The set enumerates, so a missing group fails rather than goes unnoticed.
 * `menu` joined the navigation group with prompt 39: a mobile drawer needs a trigger, and the set had no
 * three-line glyph — the count below moved from 89 to 90 for that one addition, and to 93 with the three
 * colour-mode glyphs prompt 40 added for `theme-toggle`.
 */
const GROUPS: Readonly<Record<string, readonly IconName[]>> = {
  editor: [
    'cursor',
    'hand',
    'move',
    'resize',
    'duplicate',
    'delete',
    'lock',
    'unlock',
    'eye',
    'eye-off',
    'undo',
    'redo',
    'copy',
    'paste',
    'scissors',
    'group',
    'ungroup',
  ],
  layout: [
    'layout-grid',
    'layout-columns',
    'layout-rows',
    'align-left',
    'align-center-h',
    'align-right',
    'align-top',
    'align-center-v',
    'align-bottom',
    'distribute-h',
    'distribute-v',
    'padding',
    'margin',
    'gap',
  ],
  style: [
    'palette',
    'droplet',
    'gradient',
    'blur',
    'shadow',
    'border',
    'radius',
    'opacity',
    'type',
    'sparkles',
    'noise',
  ],
  motion: [
    'play',
    'pause',
    'replay',
    'zap',
    'wave',
    'spring',
    'curve',
    'timeline',
    'cursor-follow',
  ],
  navigation: [
    'chevron-up',
    'chevron-down',
    'chevron-left',
    'chevron-right',
    'plus',
    'minus',
    'menu',
    'x',
    'check',
    'search',
    'settings',
    'more-horizontal',
    'more-vertical',
    'external-link',
    'panel-left',
    'panel-right',
  ],
  blocks: [
    'hero',
    'grid',
    'card',
    'list',
    'table',
    'form',
    'navbar',
    'footer',
    'image',
    'video',
    'code',
  ],
  files: ['file', 'folder', 'download', 'upload', 'save', 'export', 'history'],
  status: ['info', 'warning', 'error', 'success', 'loading'],
  /*
   * The three the `theme-toggle` block needs (prompt 40). A colour-mode switch has three states and a
   * segmented control shows all three at once, so it needs three glyphs rather than one that cycles —
   * and `monitor` is what "whatever the system says" looks like when the other two are weather.
   */
  theme: ['sun', 'moon', 'monitor'],
}

const SOURCE_DIR = dirname(fileURLToPath(import.meta.url))

const iconModules = (): string[] =>
  readdirSync(SOURCE_DIR)
    .filter((file) => file.endsWith('.tsx'))
    .filter((file) => !file.endsWith('.test.tsx') && file !== 'create-icon.tsx')
    .map((file) => file.replace('.tsx', ''))

describe('ICON_REGISTRY', () => {
  it.each(ICON_NAMES)('renders %s without throwing', (name) => {
    const Icon = ICON_REGISTRY[name]
    const { container } = render(<Icon />)

    expect(container.querySelector('svg')).not.toBeNull()
  })

  it('has an entry for every icon module on disk', () => {
    // The half a derived type cannot check: a new file that nobody registered.
    expect([...iconModules()].sort()).toEqual([...ICON_NAMES].sort())
  })

  it('holds a component for every name in the geometry table, and no name outside it', () => {
    // ADR-250: the table is the set. A glyph nobody draws and a component with no glyph both fail here,
    // and the annotation on `ICON_REGISTRY` catches the second one at compile time as well.
    expect(Object.keys(ICON_REGISTRY).sort()).toEqual(Object.keys(ICON_GEOMETRY).sort())
  })

  it('draws every glyph with at least one shape', () => {
    for (const [name, shapes] of Object.entries(ICON_GEOMETRY)) {
      expect(shapes.length, name).toBeGreaterThan(0)
    }
  })

  it('carries the 93 icons the set is now made of', () => {
    expect(ICON_NAMES).toHaveLength(93)
  })

  it.each(Object.entries(GROUPS))('covers every %s icon', (_group, names) => {
    for (const name of names) {
      expect(ICON_REGISTRY[name], name).toBeDefined()
    }
  })

  it('accounts for every name in exactly one group', () => {
    const grouped = Object.values(GROUPS).flat()

    expect(new Set(grouped).size).toBe(grouped.length)
    expect([...grouped].sort()).toEqual([...ICON_NAMES].sort())
  })
})

describe('the eager registry stays affordable', () => {
  it('keeps the whole set under 8 kB gzipped', () => {
    // Source, not bundle: source carries the comments and formatting a bundler strips, so this is a
    // conservative bound on the shipped size. Prompt 07 makes the 8 kB budget the condition on the eager
    // decision — if it is ever exceeded, the decision is revisited with a measurement, not silently
    // switched to lazy loading.
    // `geometry.ts` carries every glyph since ADR-250; leaving it out would measure the budget against
    // modules that no longer hold anything.
    const files = [
      ...iconModules().map((name) => `${name}.tsx`),
      'registry.ts',
      'geometry.ts',
      'create-icon.tsx',
    ]
    const sources = files.map((file) => readFileSync(join(SOURCE_DIR, file), 'utf8')).join('\n')

    const gzipped = gzipSync(Buffer.from(sources)).byteLength

    expect(gzipped, `${gzipped} bytes`).toBeLessThan(8 * 1024)
  })
})
