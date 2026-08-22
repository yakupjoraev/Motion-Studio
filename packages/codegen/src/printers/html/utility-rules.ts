import {
  BLUR,
  DURATION,
  EASING,
  FONT_FAMILY,
  FONT_WEIGHT,
  LIGHT,
  RADIUS,
  SHADOW_STATIC,
  SPACE,
  TYPE_SCALE,
} from '@motion-studio/tokens'

import { KEYWORDS } from './utility-keywords'

/**
 * One Tailwind utility → the declarations a browser with no build step needs — ADR-238.
 *
 * Every themed declaration points at the `--ms-*` variable `packages/tokens` § to-tailwind points the
 * same namespace at, so a class paints the same colour here as it does in the React export and keeps
 * responding to the colour-mode switch this document ships. A resolved value would be a third spelling
 * of the token and a dead one.
 *
 * The token *keys* are read off `packages/tokens` rather than transcribed, so a scale that gains a step
 * gains it here too. The container widths are the exception and are Tailwind's own, because
 * `max-w-3xl` is not one of our tokens.
 */
const variable = (group: string, token: string): string => `var(--ms-${group}-${token})`

/** `[16rem]` and `[repeat(auto-fit,minmax(16rem,1fr))]` — the value is in the class, so read it. */
const arbitrary = (value: string): string | undefined =>
  value.startsWith('[') && value.endsWith(']')
    ? value.slice(1, -1).replace(/_/g, ' ').replace(/,/g, ', ')
    : undefined

const scaled =
  (group: string, scale: object) =>
  (value: string): string | undefined =>
    Object.hasOwn(scale, value) ? variable(group, value) : arbitrary(value)

const space = scaled('space', SPACE)
const radius = scaled('radius', RADIUS)
const color = scaled('color', LIGHT)
const SHADOW_LEVELS = { xs: 0, sm: 0, md: 0, lg: 0, xl: 0, '2xl': 0, ...SHADOW_STATIC }

const shadow = scaled('shadow', SHADOW_LEVELS)
const blur = scaled('blur', BLUR)
const duration = scaled('duration', DURATION)
const ease = scaled('ease', EASING)
const weight = scaled('font-weight', FONT_WEIGHT)
const family = scaled('font', FONT_FAMILY)

/** Tailwind's container scale, which is not a Motion Studio token and so is transcribed. */
const CONTAINERS: Readonly<Record<string, string>> = {
  xs: '20rem',
  sm: '24rem',
  md: '28rem',
  lg: '32rem',
  xl: '36rem',
  '2xl': '42rem',
  '3xl': '48rem',
  '4xl': '56rem',
  '5xl': '64rem',
  '6xl': '72rem',
  '7xl': '80rem',
  prose: '65ch',
}

type Resolver = (value: string) => readonly string[] | undefined

/** `property: <resolved>` for the common single-declaration case. */
const one =
  (property: string, resolve: (value: string) => string | undefined): Resolver =>
  (value) => {
    const resolved = resolve(value)

    return resolved === undefined ? undefined : [`${property}: ${resolved}`]
  }

const many =
  (properties: readonly string[], resolve: (value: string) => string | undefined): Resolver =>
  (value) => {
    const resolved = resolve(value)

    return resolved === undefined
      ? undefined
      : properties.map((property) => `${property}: ${resolved}`)
  }

const track = (value: string): string | undefined => {
  const count = Number.parseInt(value, 10)

  return String(count) === value && count > 0
    ? `repeat(${count}, minmax(0, 1fr))`
    : value === 'none'
      ? 'none'
      : arbitrary(value)
}

/** A size utility takes the spacing scale first, `full`/`auto`/`min`/`max`/`fit` after it. */
const NAMED_SIZES: Readonly<Record<string, string>> = {
  full: '100%',
  auto: 'auto',
  min: 'min-content',
  max: 'max-content',
  fit: 'fit-content',
  px: '1px',
}

const size = (value: string): string | undefined => NAMED_SIZES[value] ?? space(value)

/** `text-lg` sets all three, because that is what Tailwind's `--text-*--*` modifiers do. */
const typeScale = (value: string): readonly string[] | undefined =>
  Object.hasOwn(TYPE_SCALE, value)
    ? [
        `font-size: ${variable('text', value)}`,
        `line-height: ${variable('text', `${value}-line-height`)}`,
        `letter-spacing: ${variable('text', `${value}-tracking`)}`,
      ]
    : undefined

/**
 * `text-` is three families at once: alignment (a keyword, matched before we get here), a step of the
 * type scale, and a colour. The scale is consulted first because its keys and the colour tokens' keys
 * do not overlap, and a step that also names a colour would be a token-set defect, not an ambiguity.
 */
const textUtility: Resolver = (value) => typeScale(value) ?? one('color', color)(value)

/**
 * `border-2` is a width, `border-accent` is a colour, and no table can tell them apart without the
 * config — so the number decides, which is the same rule Tailwind's own parser uses.
 */
const borderSide = (properties: readonly string[]): Resolver => {
  const widths = properties.map((property) => `${property}-width`)
  const colors = properties.map((property) => `${property}-color`)

  return (value) =>
    /^\d+$/.test(value)
      ? widths.map((property) => `${property}: ${value}px`)
      : many(colors, color)(value)
}

const JUSTIFY: Readonly<Record<string, string>> = {
  start: 'flex-start',
  end: 'flex-end',
  center: 'center',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
  stretch: 'stretch',
}

const PREFIXES: readonly (readonly [string, Resolver])[] = [
  // spacing
  ['p-', one('padding', space)],
  ['px-', one('padding-inline', space)],
  ['py-', one('padding-block', space)],
  ['pt-', one('padding-top', space)],
  ['pr-', one('padding-right', space)],
  ['pb-', one('padding-bottom', space)],
  ['pl-', one('padding-left', space)],
  ['ps-', one('padding-inline-start', space)],
  ['pe-', one('padding-inline-end', space)],
  ['m-', one('margin', size)],
  ['mx-', one('margin-inline', size)],
  ['my-', one('margin-block', size)],
  ['mt-', one('margin-top', size)],
  ['mr-', one('margin-right', size)],
  ['mb-', one('margin-bottom', size)],
  ['ml-', one('margin-left', size)],
  ['gap-x-', one('column-gap', space)],
  ['gap-y-', one('row-gap', space)],
  ['gap-', one('gap', space)],

  // sizing
  ['size-', many(['width', 'height'], size)],
  ['w-', one('width', size)],
  ['min-w-', one('min-width', size)],
  ['max-w-', one('max-width', (value) => CONTAINERS[value] ?? size(value))],
  ['h-', one('height', size)],
  ['min-h-', one('min-height', size)],
  ['max-h-', one('max-height', size)],

  // position
  ['inset-', one('inset', size)],
  ['inset-x-', one('inset-inline', size)],
  ['inset-y-', one('inset-block', size)],
  ['top-', one('top', size)],
  ['right-', one('right', size)],
  ['bottom-', one('bottom', size)],
  ['left-', one('left', size)],
  ['z-', one('z-index', (value) => (/^-?\d+$/.test(value) ? value : arbitrary(value)))],

  // flex and grid
  ['grid-cols-', one('grid-template-columns', track)],
  ['grid-rows-', one('grid-template-rows', track)],
  ['col-span-', one('grid-column', (value) => `span ${value} / span ${value}`)],
  ['row-span-', one('grid-row', (value) => `span ${value} / span ${value}`)],
  ['basis-', one('flex-basis', size)],
  ['order-', one('order', (value) => value)],
  ['items-', one('align-items', (value) => (value === 'center' ? 'center' : `flex-${value}`))],
  ['justify-', one('justify-content', (value) => JUSTIFY[value])],
  ['self-', one('align-self', (value) => (value === 'center' ? 'center' : `flex-${value}`))],

  // borders, radius, background
  ['rounded-t-', many(['border-top-left-radius', 'border-top-right-radius'], radius)],
  ['rounded-b-', many(['border-bottom-left-radius', 'border-bottom-right-radius'], radius)],
  ['rounded-l-', many(['border-top-left-radius', 'border-bottom-left-radius'], radius)],
  ['rounded-r-', many(['border-top-right-radius', 'border-bottom-right-radius'], radius)],
  ['rounded-', one('border-radius', radius)],
  ['border-x-', borderSide(['border-inline'])],
  ['border-y-', borderSide(['border-block'])],
  ['border-t-', borderSide(['border-top'])],
  ['border-r-', borderSide(['border-right'])],
  ['border-b-', borderSide(['border-bottom'])],
  ['border-l-', borderSide(['border-left'])],
  ['border-', borderSide(['border'])],
  ['bg-', one('background-color', color)],
  ['fill-', one('fill', color)],
  ['stroke-', one('stroke', color)],

  // typography
  ['text-', textUtility],
  ['font-', (value) => one('font-weight', weight)(value) ?? one('font-family', family)(value)],
  ['leading-', one('line-height', (value) => NAMED_SIZES[value] ?? space(value) ?? value)],
  ['tracking-', one('letter-spacing', (value) => arbitrary(value) ?? `${value}em`)],
  ['decoration-', one('text-decoration-color', color)],

  // effects
  ['shadow-', one('box-shadow', shadow)],
  ['opacity-', one('opacity', (value) => (/^\d+$/.test(value) ? `${value}%` : arbitrary(value)))],
  ['blur-', one('filter', (value) => `blur(${blur(value) ?? value})`)],
  ['backdrop-blur-', one('backdrop-filter', (value) => `blur(${blur(value) ?? value})`)],
  ['mix-blend-', one('mix-blend-mode', (value) => value)],
  ['duration-', one('transition-duration', duration)],
  ['delay-', one('transition-delay', duration)],
  ['ease-', one('transition-timing-function', ease)],
  ['cursor-', one('cursor', (value) => value)],
  ['aspect-', one('aspect-ratio', (value) => arbitrary(value) ?? value.replace('/', ' / '))],
]

/** Longest first, so `gap-x-` is consulted before `gap-` and `max-w-` before `w-`. */
const ORDERED = [...PREFIXES].sort((left, right) => right[0].length - left[0].length)

/**
 * The declarations for one unprefixed utility, or `undefined` when the table does not know it. Never a
 * guess: a class with no entry is reported by the caller, because a generator that invents a
 * declaration from a class name paints the wrong thing and says nothing.
 */
export function declarationsFor(utility: string): readonly string[] | undefined {
  const keyword = KEYWORDS[utility]

  if (keyword !== undefined) {
    return keyword
  }

  const negative = utility.startsWith('-')
  const bare = negative ? utility.slice(1) : utility

  for (const [prefix, resolve] of ORDERED) {
    if (!bare.startsWith(prefix)) {
      continue
    }

    const resolved = resolve(bare.slice(prefix.length))

    if (resolved !== undefined) {
      return negative
        ? resolved.map((declaration) => `${declaration.replace(': ', ': calc(-1 * ')})`)
        : resolved
    }
  }

  return undefined
}
