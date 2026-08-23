import { type MarkupRegistry, defineMarkup, el, slot, txt } from '@motion-studio/schema'

/**
 * The fixture catalogue's producers — ADR-252. They stand where the descriptors' class rules used to,
 * and they are deliberately small: what these fixtures exercise is the export engine, not a design
 * system, so each one emits the classes its props imply and a slot for whatever the document put in it.
 */
const SPACE: Readonly<Record<string, readonly string[]>> = {
  none: [],
  sm: ['px-4', 'py-8'],
  md: ['px-6', 'py-16'],
  lg: ['px-8', 'py-24'],
}

const cases = (
  value: unknown,
  table: Readonly<Record<string, readonly string[]>>,
): readonly string[] => table[typeof value === 'string' ? value : String(value)] ?? []

interface FixtureProps {
  readonly plan?: string
  readonly price?: number
  readonly padding?: string
  readonly hidden?: boolean
  readonly tint?: string
  readonly columns?: number
  readonly gap?: string
  readonly density?: string
  readonly mode?: string
}

/** A container with its own classes and one slot, which is what most of these fixtures are. */
const container = (tag: string, classNames: readonly string[]) =>
  defineMarkup(() => el(tag, { classNames, children: [slot()] }))

export const fixtureMarkup: MarkupRegistry = {
  page: container('main', ['flex', 'flex-col']),

  section: defineMarkup<FixtureProps>(({ props }) =>
    el('section', {
      classNames: [
        'relative',
        'isolate',
        'overflow-hidden',
        ...cases(props.padding, SPACE),
        // Absent is not `false`: a node that says nothing about visibility gets no class either.
        props.hidden === undefined ? false : props.hidden ? 'hidden' : 'block',
      ],
      ...(typeof props.tint === 'string' && props.tint !== ''
        ? { cssVars: { backgroundColor: props.tint } }
        : {}),
      children: [slot()],
    }),
  ),

  hero: defineMarkup<FixtureProps>(({ props }) =>
    el('section', {
      classNames: ['mx-auto', 'max-w-3xl', 'text-center', ...cases(props.padding, SPACE)],
      children: [slot()],
    }),
  ),

  nav: container('nav', ['flex', 'items-center', 'gap-4']),

  'pricing-grid': defineMarkup<FixtureProps>(({ props }) =>
    el('div', {
      classNames: [
        'grid',
        ...cases(props.columns, {
          1: ['grid-cols-1'],
          2: ['grid-cols-2'],
          3: ['grid-cols-3'],
        }),
        ...cases(props.gap, { sm: ['gap-2'], md: ['gap-4'], lg: ['gap-8'] }),
      ],
      children: [slot()],
    }),
  ),

  /** A case that carries its own breakpoints, the way the real `grid` block's `cva` map does. */
  'stepped-grid': defineMarkup<FixtureProps>(({ props }) =>
    el('div', {
      classNames: [
        'grid',
        ...cases(props.columns, {
          1: ['grid-cols-1'],
          3: ['grid-cols-1', 'sm:grid-cols-2', 'lg:grid-cols-3'],
        }),
      ],
      children: [slot()],
    }),
  ),

  /** A variant that overrides its own static base, so the merge has a conflict to resolve. */
  panel: defineMarkup<FixtureProps>(({ props }) =>
    el('div', {
      classNames: [
        'rounded-lg',
        'p-4',
        ...cases(props.density, { compact: ['p-2'], loose: ['p-8'] }),
      ],
      children: [slot()],
    }),
  ),

  /** The one fixture that prints its props, so rule 3 has values to lift into a component. */
  'plan-card': defineMarkup<FixtureProps>(({ props }) =>
    el('article', {
      classNames: ['rounded-xl', 'border', 'bg-surface-1', 'p-6'],
      children: [
        el('h3', { classNames: ['font-semibold'], children: [txt(String(props.plan ?? ''))] }),
        el('p', { classNames: ['tabular-nums'], children: [txt(String(props.price ?? ''))] }),
        slot(),
      ],
    }),
  ),

  grid: defineMarkup<FixtureProps>(({ props }) =>
    el('div', {
      classNames: [
        'grid',
        ...cases(props.mode, {
          explicit: ['grid-cols-3'],
          'auto-fit': ['grid-cols-[repeat(auto-fit,minmax(16rem,1fr))]'],
        }),
      ],
      children: [slot()],
    }),
  ),

  image: defineMarkup(() => el('img', { classNames: ['w-full', 'rounded-lg', 'object-cover'] })),

  faq: container('section', ['flex', 'flex-col', 'gap-2']),

  toggle: defineMarkup(() => el('button', { classNames: ['inline-flex', 'size-8', 'rounded-md'] })),

  carousel: container('div', ['flex', 'snap-x', 'overflow-x-auto']),

  chart: container('figure', ['relative', 'h-32']),

  'hook-box': container('div', ['flex', 'flex-col', 'gap-2']),

  'hook-button': defineMarkup(() =>
    el('button', { classNames: ['flex', 'flex-col', 'gap-2'], children: [slot()] }),
  ),

  undeclared: container('div', []),
}
