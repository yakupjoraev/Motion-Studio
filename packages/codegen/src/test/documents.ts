import {
  type BreakpointId,
  type MotionDocument,
  type MotionSpec,
  type Node,
  blockId,
  nodeId,
} from '@motion-studio/schema'

import { spec } from './presets'

/**
 * The documents EXPORT_ENGINE.md § Testing names, written as trees rather than as JSON so a failing
 * assertion reads as the shape the test meant. Ids are explicit for the reason the schema's own
 * factories give: a fixture nobody can reproduce is a measurement nobody can repeat.
 *
 * The theme is a literal rather than a preset, so an assertion here cannot change because somebody
 * retuned `studioDark`.
 */
export const FIXTURE_THEME: MotionDocument['theme'] = {
  id: 'fixture',
  name: 'Fixture',
  colorMode: 'dark',
  palette: {
    accent: 'oklch(62% 0.19 285)',
    neutral: 'zinc',
    accentHueShift: 0,
    saturation: 1,
    repairContrast: true,
  },
  radiusScale: 1,
  spacingScale: 1,
  motionScale: 1,
  elevationStyle: 'soft',
  typography: { pairing: 'geist', baseSize: 16, scaleRatio: 1.25 },
  surface: { glassLevel: 'subtle', noiseLevel: 'subtle', borderStyle: 'hairline' },
}

export interface TreeSpec {
  readonly id: string
  readonly block: string
  readonly name?: string
  readonly props?: Readonly<Record<string, unknown>>
  readonly responsive?: Readonly<Partial<Record<BreakpointId, Record<string, unknown>>>>
  readonly motion?: Readonly<Partial<Record<'entrance' | 'scroll' | 'hover', MotionSpec>>>
  readonly hidden?: boolean
  readonly children?: readonly TreeSpec[]
}

export function document(tree: TreeSpec, overrides: Partial<MotionDocument> = {}): MotionDocument {
  const nodes: Record<string, Node> = {}

  const visit = (current: TreeSpec, parent: string | null, slot: string): void => {
    nodes[current.id] = {
      id: nodeId(current.id),
      blockId: blockId(current.block),
      name: current.name ?? current.block,
      parentId: parent === null ? null : nodeId(parent),
      slot,
      children: (current.children ?? []).map((child) => nodeId(child.id)),
      props: current.props ?? {},
      responsive: current.responsive ?? {},
      motion: current.motion ?? {},
      effects: [],
      locked: false,
      hidden: current.hidden ?? false,
    }

    for (const child of current.children ?? []) {
      visit(child, current.id, 'children')
    }
  }

  visit(tree, null, 'root')

  return {
    version: 1,
    meta: {
      id: 'doc_fixture',
      name: 'Fixture',
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      generator: 'motion-studio@0.0.0',
      canvas: { width: 1440, background: 'surface-0' },
    },
    theme: FIXTURE_THEME,
    rootId: nodeId(tree.id),
    nodes: nodes as MotionDocument['nodes'],
    assets: {},
    ...overrides,
  }
}

const card = (id: string, plan: string, price: number, extra?: readonly TreeSpec[]): TreeSpec => ({
  id,
  block: 'plan-card',
  name: 'Plan card',
  props: { plan, price },
  ...(extra === undefined ? {} : { children: extra }),
})

/** One section, one hero. The smallest document that produces two components. */
export const singleHero = (): MotionDocument =>
  document({
    id: 'node_root',
    block: 'page',
    name: 'Page',
    children: [
      {
        id: 'node_hero',
        block: 'hero',
        name: 'Hero',
        props: { padding: 'lg', title: 'Design motion, ship code' },
        motion: { entrance: spec('fade-up', { params: { distance: 32, duration: 0.6 } }) },
      },
    ],
  })

/** The document the prompt asks to be read and judged: every rule of pass 1 firing at once. */
export const fullLanding = (): MotionDocument =>
  document({
    id: 'node_root',
    block: 'page',
    name: 'Page',
    children: [
      { id: 'node_nav', block: 'nav', name: 'Nav', props: { links: ['Product', 'Pricing'] } },
      {
        id: 'node_hero',
        block: 'hero',
        name: 'Hero',
        props: { padding: 'lg', title: 'Design motion, ship code' },
        motion: {
          entrance: spec('fade-up', { params: { distance: 32, duration: 0.6 } }),
          hover: spec('shine', { channel: 'hover', trigger: { kind: 'hover' } }),
        },
      },
      {
        id: 'node_pricing',
        block: 'pricing-grid',
        name: 'Pricing',
        props: { columns: 3, gap: 'lg' },
        motion: { entrance: spec('fade-up', { params: { distance: 32, duration: 0.6 } }) },
        children: [
          card('node_plan1', 'Starter', 0),
          card('node_plan2', 'Pro', 29),
          card('node_plan3', 'Team', 79),
        ],
      },
      {
        id: 'node_media',
        block: 'section',
        name: 'Media',
        props: { padding: 'md', tint: 'oklch(22% 0.02 285)' },
        responsive: { lg: { padding: 'lg' } },
        children: [
          {
            id: 'node_image',
            block: 'image',
            name: 'Screenshot',
            props: {
              src: 'https://cdn.example.com/studio.png',
              alt: 'The studio canvas',
              width: 1600,
              height: 1000,
              sizes: '100vw',
            },
          },
        ],
      },
      {
        id: 'node_faq',
        block: 'faq',
        name: 'FAQ',
        props: { schemaOrg: true, items: [{ q: 'Is it free?', a: 'The editor is.' }] },
      },
      { id: 'node_toggle', block: 'toggle', name: 'Theme toggle', props: {} },
    ],
  })

/** Three identical cards, one component. The fourth differs in structure and must not join them. */
export const repeatedSubtrees = (): MotionDocument =>
  document({
    id: 'node_root',
    block: 'page',
    name: 'Page',
    children: [
      {
        id: 'node_grid',
        block: 'pricing-grid',
        name: 'Pricing',
        props: { columns: 3, gap: 'md' },
        children: [
          card('node_a', 'Starter', 0),
          card('node_b', 'Pro', 29),
          card('node_c', 'Team', 79),
          card('node_d', 'Custom', 0, [
            { id: 'node_badge', block: 'section', props: { padding: 'sm' } },
          ]),
        ],
      },
    ],
  })

/** RESPONSIVE_ENGINE.md § Codegen's own example, plus one override that is already inherited. */
export const responsiveOverrides = (): MotionDocument =>
  document({
    id: 'node_root',
    block: 'page',
    name: 'Page',
    children: [
      {
        id: 'node_grid',
        block: 'pricing-grid',
        name: 'Grid',
        props: { columns: 1, gap: 'md' },
        responsive: { md: { columns: 2 }, lg: { columns: 3, gap: 'lg' }, xl: { gap: 'lg' } },
      },
    ],
  })

/** Eight sections on one preset: the document the hoisting rule is stated in terms of. */
export const eightFadeUp = (): MotionDocument =>
  document({
    id: 'node_root',
    block: 'page',
    name: 'Page',
    children: Array.from({ length: 8 }, (_, index) => ({
      id: `node_s${index}`,
      block: 'hero',
      name: `Band ${index + 1}`,
      props: { padding: 'md' },
      motion: { entrance: spec('fade-up', { params: { distance: 32, duration: 0.6 } }) },
    })),
  })

/** Containers inside containers: rule 4, and nothing extracted from a tree with no repetition. */
export const nestedContainers = (): MotionDocument =>
  document({
    id: 'node_root',
    block: 'page',
    name: 'Page',
    children: [
      {
        id: 'node_outer',
        block: 'section',
        name: 'Outer',
        props: { padding: 'lg' },
        children: [
          {
            id: 'node_inner',
            block: 'section',
            name: 'Inner',
            props: { padding: 'sm' },
            children: [
              { id: 'node_leaf', block: 'grid', name: 'Leaf', props: { mode: 'explicit' } },
            ],
          },
        ],
      },
    ],
  })
