/**
 * What the HTML target may carry, by name: the tags with no closing form, the props that belong to
 * Motion rather than to a document, the attributes an exported page can legitimately hold, and the
 * React spellings HTML gives another word to.
 *
 * They are separated from the serialiser because they are a decision about the **target**, and
 * `print-markup.ts` is only about how a decided element is written out.
 */
/** Elements with no closing tag. `<img>` is the one this export actually produces. */
export const VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'source',
  'track',
  'wbr',
])

/**
 * The props pass 4 bakes for `motion.*`. They are dropped in silence: the element's approximation
 * warning already names what happened to the animation, and repeating it per attribute would bury it.
 */
export const MOTION_PROPS = new Set([
  'animate',
  'custom',
  'drag',
  'exit',
  'initial',
  'layout',
  'layoutId',
  'transition',
  'variants',
  'viewport',
  'whileDrag',
  'whileFocus',
  'whileHover',
  'whileInView',
  'whileTap',
])

/** Attributes an exported document can legitimately carry. `data-*` and `aria-*` pass by prefix. */
export const HTML_ATTRIBUTES = new Set([
  'alt',
  'autocomplete',
  'checked',
  'cite',
  'colspan',
  'content',
  'controls',
  'datetime',
  'decoding',
  'dir',
  'disabled',
  'download',
  'draggable',
  'fetchpriority',
  'for',
  'height',
  'hidden',
  'href',
  'id',
  'lang',
  'loading',
  'loop',
  'max',
  'maxlength',
  'min',
  'muted',
  'name',
  'novalidate',
  'open',
  'placeholder',
  'playsinline',
  'poster',
  'preload',
  'readonly',
  'rel',
  'required',
  'role',
  'rowspan',
  'scope',
  'sizes',
  'span',
  'src',
  'srcset',
  'step',
  'tabindex',
  'target',
  'title',
  'type',
  'value',
  'width',
])

/**
 * The inline `<svg>` an icon prints as — ADR-250. It is a short list on purpose: it is exactly what
 * `packages/blocks` emits for a glyph, and an SVG attribute nobody produces would be a claim about the
 * export that no test could check.
 */
export const SVG_ATTRIBUTES = new Set([
  'viewBox',
  'fill',
  'stroke',
  'stroke-width',
  'stroke-linecap',
  'stroke-linejoin',
  'stroke-dasharray',
  'focusable',
  'opacity',
  'preserveAspectRatio',
  'vector-effect',
  'd',
  'cx',
  'cy',
  'r',
])

/**
 * The attributes whose presence *is* their value. Everything else — `aria-*` above all — spells a
 * boolean out, because `aria-expanded="false"` and no `aria-expanded` at all say different things.
 */
export const BOOLEAN_ATTRIBUTES = new Set([
  'checked',
  'controls',
  'disabled',
  'draggable',
  'hidden',
  'loop',
  'muted',
  'novalidate',
  'open',
  'playsinline',
  'readonly',
  'required',
])

/**
 * React spellings that are a different word in HTML. The IR holds the React one throughout, because
 * `stroke-width` in JSX is a dev-mode warning in every React app that renders the exported component.
 */
export const RENAMED: Readonly<Record<string, string>> = {
  className: 'class',
  htmlFor: 'for',
  strokeWidth: 'stroke-width',
  strokeLinecap: 'stroke-linecap',
  strokeLinejoin: 'stroke-linejoin',
  strokeDasharray: 'stroke-dasharray',
  vectorEffect: 'vector-effect',
  noValidate: 'novalidate',
  tabIndex: 'tabindex',
  colSpan: 'colspan',
  rowSpan: 'rowspan',
  maxLength: 'maxlength',
  autoComplete: 'autocomplete',
  readOnly: 'readonly',
  playsInline: 'playsinline',
  fetchPriority: 'fetchpriority',
  srcSet: 'srcset',
  dateTime: 'datetime',
}
