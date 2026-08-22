import {
  type BlockDefinition,
  type BlockRegistry,
  blockId,
  createRegistry,
} from '@motion-studio/schema'
import { z } from 'zod'

/**
 * The catalogue the export engine's tests run against. It is not the real one: `codegen` must not
 * import `blocks` (ARCHITECTURE.md § Dependency graph, rule 3), so the fixtures declare the same
 * descriptor fields the catalogue declares and nothing else.
 *
 * Every entry declares `client` and `classes`, which is what a catalogue entry is supposed to do —
 * ADR-225 and ADR-227 record what the real one is still missing.
 */
const base = {
  description: 'A fixture block',
  tags: [],
  icon: 'card',
  propsSchema: z.object({}).passthrough(),
  defaults: {},
  previewProps: {},
  slots: [
    { name: 'root', label: 'Root', accepts: '*' as const, minChildren: 0, maxChildren: null },
    {
      name: 'children',
      label: 'Children',
      accepts: '*' as const,
      minChildren: 0,
      maxChildren: null,
    },
  ],
  controls: [],
  capabilities: {
    resizable: true,
    fullWidth: false,
    requiresBackdrop: false,
    supportsMotion: ['entrance'] as const,
    costClass: 'cheap' as const,
  },
  defaultMotion: {},
  a11y: { notes: ['A fixture'] },
}

const define = (id: string, overrides: Partial<BlockDefinition>): BlockDefinition => ({
  ...base,
  id: blockId(id),
  name: id,
  category: 'layout',
  codegen: { tag: 'div' },
  ...overrides,
})

const NEVER = { kind: 'never' as const, reason: 'Static markup, no state and no handler.' }

const SPACE = {
  none: [],
  sm: ['px-4', 'py-8'],
  md: ['px-6', 'py-16'],
  lg: ['px-8', 'py-24'],
}

const HOOK_PROPS = [
  'aria-controls',
  'aria-expanded',
  'aria-pressed',
  'data-ms-carousel',
  'data-ms-carousel-step',
  'data-ms-carousel-track',
  'data-ms-color-mode-toggle',
  'data-ms-disclosure',
  'data-ms-menu',
  'data-ms-menu-panel',
  'data-ms-menu-trigger',
  'hidden',
  'href',
  'id',
]

const HOOKED = (tag: string): BlockDefinition['codegen'] => ({
  tag,
  client: { kind: 'always', reason: 'The disclosure, the menu and the toggle all keep state.' },
  passthroughProps: HOOK_PROPS,
  classes: [{ kind: 'static', classes: ['flex', 'flex-col', 'gap-2'] }],
})

export const FIXTURE_BLOCKS: readonly BlockDefinition[] = [
  define('page', {
    name: 'Page',
    codegen: {
      tag: 'main',
      client: NEVER,
      classes: [{ kind: 'static', classes: ['flex', 'flex-col'] }],
    },
  }),
  define('section', {
    name: 'Section',
    codegen: {
      tag: 'section',
      client: NEVER,
      classes: [
        { kind: 'static', classes: ['relative', 'isolate', 'overflow-hidden'] },
        { kind: 'variant', prop: 'padding', cases: SPACE },
        { kind: 'variant', prop: 'hidden', cases: { true: ['hidden'], false: ['block'] } },
        {
          kind: 'custom',
          prop: 'tint',
          property: 'background-color',
          variable: '--ms-section-tint',
        },
      ],
    },
  }),
  define('hero', {
    name: 'Hero',
    category: 'hero',
    codegen: {
      tag: 'section',
      client: NEVER,
      classes: [
        { kind: 'static', classes: ['mx-auto', 'max-w-3xl', 'text-center'] },
        { kind: 'variant', prop: 'padding', cases: SPACE },
      ],
    },
  }),
  define('nav', {
    name: 'Nav',
    category: 'navigation',
    codegen: {
      tag: 'nav',
      client: { kind: 'always', reason: 'The menu opens and closes.' },
      classes: [{ kind: 'static', classes: ['flex', 'items-center', 'gap-4'] }],
    },
  }),
  define('pricing-grid', {
    name: 'Pricing grid',
    category: 'marketing',
    codegen: {
      tag: 'div',
      client: NEVER,
      classes: [
        { kind: 'static', classes: ['grid'] },
        {
          kind: 'variant',
          prop: 'columns',
          cases: { 1: ['grid-cols-1'], 2: ['grid-cols-2'], 3: ['grid-cols-3'] },
        },
        { kind: 'variant', prop: 'gap', cases: { sm: ['gap-2'], md: ['gap-4'], lg: ['gap-8'] } },
      ],
    },
  }),
  /** A case that carries its own breakpoints, the way the real `grid` block's `cva` map does. */
  define('stepped-grid', {
    name: 'Stepped grid',
    codegen: {
      tag: 'div',
      client: NEVER,
      classes: [
        { kind: 'static', classes: ['grid'] },
        {
          kind: 'variant',
          prop: 'columns',
          cases: {
            1: ['grid-cols-1'],
            3: ['grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3'],
          },
        },
      ],
    },
  }),
  /** A variant that overrides its own static base, so the merge has a conflict to resolve. */
  define('panel', {
    name: 'Panel',
    codegen: {
      tag: 'div',
      client: NEVER,
      classes: [
        { kind: 'static', classes: ['rounded-lg', 'p-4'] },
        { kind: 'variant', prop: 'density', cases: { compact: ['p-2'], loose: ['p-8'] } },
      ],
    },
  }),
  define('plan-card', {
    name: 'Plan card',
    category: 'marketing',
    codegen: {
      tag: 'article',
      client: NEVER,
      classes: [{ kind: 'static', classes: ['rounded-xl', 'border', 'bg-surface-1', 'p-6'] }],
    },
  }),
  define('grid', {
    name: 'Grid',
    codegen: {
      tag: 'div',
      client: NEVER,
      classes: [
        { kind: 'static', classes: ['grid'] },
        {
          kind: 'variant',
          prop: 'mode',
          cases: {
            explicit: ['grid-cols-3'],
            'auto-fit': ['grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]'],
          },
        },
      ],
    },
  }),
  define('image', {
    name: 'Image',
    category: 'content',
    controls: [
      {
        id: 'content',
        label: 'Content',
        controls: [{ path: 'src', kind: 'image', label: 'File' }],
      },
    ],
    codegen: {
      tag: 'img',
      client: NEVER,
      imports: [{ from: 'next/image', default: 'Image' }],
      passthroughProps: ['src', 'alt', 'width', 'height', 'sizes'],
      classes: [{ kind: 'static', classes: ['w-full', 'rounded-lg', 'object-cover'] }],
    },
  }),
  define('faq', {
    name: 'FAQ',
    category: 'content',
    codegen: {
      tag: 'section',
      client: NEVER,
      structuredData: { type: 'FAQPage', enabledBy: 'schemaOrg' },
      classes: [{ kind: 'static', classes: ['flex', 'flex-col', 'gap-2'] }],
      notes: ['Answers are plain text; wire them to your CMS.'],
    },
  }),
  define('toggle', {
    name: 'Theme toggle',
    category: 'interactive',
    codegen: {
      tag: 'button',
      client: { kind: 'always', reason: 'It writes the colour mode.' },
      classes: [{ kind: 'static', classes: ['inline-flex', 'size-8', 'rounded-md'] }],
      runtimeModule: {
        path: 'lib/color-mode.ts',
        named: ['setColorMode'],
        source: 'export const setColorMode = (mode: string) => {}',
      },
    },
  }),
  define('carousel', {
    name: 'Carousel',
    category: 'interactive',
    codegen: {
      tag: 'div',
      client: {
        kind: 'whenAnyProp',
        props: ['arrows', 'dots', 'autoplay'],
        reason: 'The arrows, dots and autoplay all need state.',
      },
      classes: [{ kind: 'static', classes: ['flex', 'snap-x', 'overflow-x-auto'] }],
    },
  }),
  define('chart', {
    name: 'Chart',
    category: 'data',
    codegen: {
      tag: 'figure',
      client: NEVER,
      dependencies: { 'recharts-fixture': '^1.0.0' },
      classes: [{ kind: 'static', classes: ['relative', 'h-32'] }],
    },
  }),
  /**
   * The two entries that declare the behaviour contract of `EXPORT_ENGINE.md` § HTML — the `data-ms-*`
   * attributes the vanilla script delegates from. No shipped block emits them yet, because a descriptor
   * describes its root element only; these exist so the contract is exercised rather than promised.
   */
  define('hook-box', { name: 'Hook box', category: 'interactive', codegen: HOOKED('div') }),
  define('hook-button', {
    name: 'Hook button',
    category: 'interactive',
    codegen: HOOKED('button'),
  }),
  /** The one entry with no `client`, so the error path has something to fail on. */
  define('undeclared', { name: 'Undeclared', codegen: { tag: 'div' } }),
]

export const fixtureRegistry = (): BlockRegistry => createRegistry(FIXTURE_BLOCKS)
