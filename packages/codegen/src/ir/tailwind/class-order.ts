import { CASCADE_ORDER } from '@motion-studio/schema'

/**
 * Tailwind's core-plugin sequence, transcribed as data — ADR-224. A `*` suffix is a prefix matcher;
 * everything else is an exact utility. Exact wins over prefix, which is how `bg-cover`
 * (background-size) sorts apart from `bg-surface-1` (background-color) without a second table.
 *
 * The order is the plugin registration order in Tailwind's own source, which is what
 * `prettier-plugin-tailwindcss` sorts by. It is not the nine groups EXPORT_ENGINE.md offered in
 * parentheses: the real sequence puts margin before display, border-radius before background, and
 * padding after both.
 *
 * The granularity is the family, not the utility. `border-2` and `border-border` share a prefix and no
 * table can tell a width from a colour without the Tailwind config, so both land in one family and keep
 * the order the class plan wrote them in. Tailwind registers `borderWidth` and `borderColor` next to
 * each other, so that differs from the plugin's output only when a plan writes the colour first.
 */
const FAMILIES: readonly string[] = [
  'sr-only not-sr-only',
  'pointer-events-*',
  'visible invisible collapse',
  'static fixed absolute relative sticky',
  'inset-* top-* right-* bottom-* left-* start-* end-*',
  'isolate isolation-auto',
  'z-*',
  'order-*',
  'col-*',
  'row-*',
  'float-*',
  'clear-*',
  'm-* mx-* my-* mt-* mr-* mb-* ml-* ms-* me-*',
  'box-border box-content',
  'line-clamp-*',
  'block inline-block inline flex inline-flex table inline-table table-caption table-cell table-column table-column-group table-footer-group table-header-group table-row-group table-row flow-root grid inline-grid contents list-item hidden',
  'aspect-*',
  'size-*',
  'h-* max-h-* min-h-*',
  'w-* min-w-* max-w-*',
  'flex-1 flex-auto flex-initial flex-none',
  'shrink-* shrink flex-shrink-*',
  'grow-* grow flex-grow-*',
  'basis-*',
  'table-auto table-fixed',
  'border-collapse border-separate',
  'border-spacing-*',
  'origin-*',
  'translate-*',
  'rotate-*',
  'skew-*',
  'scale-*',
  'transform transform-cpu transform-gpu transform-none',
  'animate-*',
  'cursor-*',
  'touch-*',
  'select-*',
  'resize resize-none resize-x resize-y',
  'snap-*',
  'scroll-*',
  'list-*',
  'appearance-*',
  'columns-*',
  'break-before-* break-inside-* break-after-*',
  'auto-cols-*',
  'grid-flow-*',
  'auto-rows-*',
  'grid-cols-*',
  'grid-rows-*',
  'flex-row flex-row-reverse flex-col flex-col-reverse',
  'flex-wrap flex-wrap-reverse flex-nowrap',
  'place-content-*',
  'place-items-*',
  'content-*',
  'items-*',
  'justify-*',
  'justify-items-*',
  'gap-* gap-x-* gap-y-*',
  'space-x-* space-y-*',
  'divide-*',
  'place-self-*',
  'self-*',
  'justify-self-*',
  'overflow-*',
  'overscroll-*',
  'text-ellipsis text-clip truncate',
  'hyphens-*',
  'whitespace-*',
  'text-wrap text-nowrap text-balance text-pretty',
  'break-normal break-words break-all break-keep',
  'rounded-*',
  'border border-* border-x-* border-y-* border-t-* border-r-* border-b-* border-l-*',
  'border-solid border-dashed border-dotted border-double border-hidden border-none',
  'bg-none bg-gradient-*',
  'from-* via-* to-*',
  'bg-auto bg-cover bg-contain',
  'bg-fixed bg-local bg-scroll',
  'bg-clip-*',
  'bg-bottom bg-center bg-left bg-right bg-top',
  'bg-repeat bg-repeat-x bg-repeat-y bg-repeat-round bg-repeat-space bg-no-repeat',
  'bg-origin-*',
  'bg-*',
  'fill-* stroke-*',
  'object-*',
  'p-* px-* py-* pt-* pr-* pb-* pl-* ps-* pe-*',
  'text-left text-center text-right text-justify text-start text-end',
  'indent-*',
  'align-*',
  'font-sans font-serif font-mono',
  'text-xs text-sm text-base text-lg text-xl text-2xl text-3xl text-4xl text-5xl text-6xl text-7xl text-8xl text-9xl',
  'font-*',
  'uppercase lowercase capitalize normal-case',
  'italic not-italic',
  'leading-*',
  'tracking-*',
  'text-*',
  'underline overline line-through no-underline',
  'decoration-*',
  'underline-offset-*',
  'antialiased subpixel-antialiased',
  'placeholder-*',
  'caret-*',
  'accent-*',
  'opacity-*',
  'bg-blend-* mix-blend-*',
  'shadow shadow-*',
  'outline outline-*',
  'ring ring-*',
  'blur blur-*',
  'brightness-* contrast-* drop-shadow-* grayscale grayscale-* hue-rotate-* invert invert-* saturate-* sepia sepia-*',
  'filter filter-none',
  'backdrop-*',
  'transition transition-*',
  'delay-*',
  'duration-*',
  'ease-*',
  'will-change-*',
  'contain-*',
  'content-none',
  '@container',
]

const exact = new Map<string, number>()
const prefixes: { readonly token: string; readonly rank: number }[] = []

FAMILIES.forEach((family, rank) => {
  for (const matcher of family.split(' ')) {
    if (matcher.endsWith('*')) {
      prefixes.push({ token: matcher.slice(0, -1), rank })
    } else if (!exact.has(matcher)) {
      exact.set(matcher, rank)
    }
  }
})

/** Longest first, so `bg-clip-` is consulted before `bg-`. */
prefixes.sort((left, right) => right.token.length - left.token.length)

/** A class whose family is not in the table sorts after every class that is, and deterministically. */
const UNKNOWN = FAMILIES.length

export interface ClassParts {
  /** `''` for an unprefixed class. */
  readonly variant: string
  readonly utility: string
}

const VARIANT_RANK = new Map<string, number>(
  CASCADE_ORDER.map((id, index) => [id === 'base' ? '' : id, index]),
)

export function splitVariant(className: string): ClassParts {
  const cut = className.lastIndexOf(':')

  return cut === -1
    ? { variant: '', utility: className }
    : { variant: className.slice(0, cut), utility: className.slice(cut + 1) }
}

export function familyRank(utility: string): number {
  const bare = utility.startsWith('-') ? utility.slice(1) : utility
  const known = exact.get(bare)

  if (known !== undefined) {
    return known
  }

  for (const { token, rank } of prefixes) {
    if (bare.startsWith(token)) {
      return rank
    }
  }

  return UNKNOWN
}

/**
 * A variant the cascade does not name — `hover:`, `@md:`, `dark:` — sorts after every breakpoint, in
 * alphabetical order. Breakpoints are the only variants `buildIR` itself emits; the rest arrive from a
 * block's own class plan, where a stable position matters more than which position it is.
 */
function variantRank(variant: string): number {
  return VARIANT_RANK.get(variant) ?? CASCADE_ORDER.length
}

/**
 * Variant-major, family-minor, and stable on ties so two classes of the same family keep the order the
 * class plan wrote them in.
 */
export function sortClasses(classNames: readonly string[]): readonly string[] {
  return classNames
    .map((className, index) => ({ className, index, parts: splitVariant(className) }))
    .sort((left, right) => {
      const variants = variantRank(left.parts.variant) - variantRank(right.parts.variant)

      if (variants !== 0) {
        return variants
      }

      if (left.parts.variant !== right.parts.variant) {
        return left.parts.variant < right.parts.variant ? -1 : 1
      }

      const families = familyRank(left.parts.utility) - familyRank(right.parts.utility)

      return families === 0 ? left.index - right.index : families
    })
    .map((entry) => entry.className)
}
