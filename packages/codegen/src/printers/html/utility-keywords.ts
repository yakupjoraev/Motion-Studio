/**
 * The utilities whose whole name is the value — `flex`, `italic`, `overflow-hidden`. One map, because a
 * keyword has nothing to resolve: there is no scale, no token and no arbitrary form, so a prefix
 * resolver would be a lookup wearing a function's clothes.
 *
 * `utility-rules.ts` holds the other half, where a value has to be read off the class.
 */
const display = (value: string): readonly string[] => [`display: ${value}`]

const position = (value: string): readonly string[] => [`position: ${value}`]

const overflow = (axis: string, value: string): readonly string[] => [`overflow${axis}: ${value}`]

/** Tailwind's `--tw-scroll-snap-strictness` default, written out: the variable has no other reader. */
const snap = (axis: string): readonly string[] => [`scroll-snap-type: ${axis} proximity`]

export const KEYWORDS: Readonly<Record<string, readonly string[]>> = {
  // display
  block: display('block'),
  'inline-block': display('inline-block'),
  inline: display('inline'),
  flex: display('flex'),
  'inline-flex': display('inline-flex'),
  grid: display('grid'),
  'inline-grid': display('inline-grid'),
  contents: display('contents'),
  'flow-root': display('flow-root'),
  'list-item': display('list-item'),
  table: display('table'),
  hidden: display('none'),

  // position and stacking
  static: position('static'),
  fixed: position('fixed'),
  absolute: position('absolute'),
  relative: position('relative'),
  sticky: position('sticky'),
  isolate: ['isolation: isolate'],
  'isolation-auto': ['isolation: auto'],

  // flex and grid keywords
  'flex-row': ['flex-direction: row'],
  'flex-row-reverse': ['flex-direction: row-reverse'],
  'flex-col': ['flex-direction: column'],
  'flex-col-reverse': ['flex-direction: column-reverse'],
  'flex-wrap': ['flex-wrap: wrap'],
  'flex-wrap-reverse': ['flex-wrap: wrap-reverse'],
  'flex-nowrap': ['flex-wrap: nowrap'],
  'flex-1': ['flex: 1 1 0%'],
  'flex-auto': ['flex: 1 1 auto'],
  'flex-initial': ['flex: 0 1 auto'],
  'flex-none': ['flex: none'],
  grow: ['flex-grow: 1'],
  'grow-0': ['flex-grow: 0'],
  shrink: ['flex-shrink: 1'],
  'shrink-0': ['flex-shrink: 0'],

  // box model keywords
  'box-border': ['box-sizing: border-box'],
  'box-content': ['box-sizing: content-box'],
  border: ['border-style: solid', 'border-width: 1px'],

  // overflow and scrolling
  'overflow-auto': overflow('', 'auto'),
  'overflow-hidden': overflow('', 'hidden'),
  'overflow-clip': overflow('', 'clip'),
  'overflow-visible': overflow('', 'visible'),
  'overflow-scroll': overflow('', 'scroll'),
  'overflow-x-auto': overflow('-x', 'auto'),
  'overflow-x-hidden': overflow('-x', 'hidden'),
  'overflow-x-scroll': overflow('-x', 'scroll'),
  'overflow-y-auto': overflow('-y', 'auto'),
  'overflow-y-hidden': overflow('-y', 'hidden'),
  'overflow-y-scroll': overflow('-y', 'scroll'),
  'snap-x': snap('x'),
  'snap-y': snap('y'),
  'snap-both': snap('both'),
  'snap-start': ['scroll-snap-align: start'],
  'snap-center': ['scroll-snap-align: center'],
  'snap-end': ['scroll-snap-align: end'],
  'snap-always': ['scroll-snap-stop: always'],
  'snap-normal': ['scroll-snap-stop: normal'],
  'scroll-smooth': ['scroll-behavior: smooth'],
  'overscroll-contain': ['overscroll-behavior: contain'],
  'overscroll-none': ['overscroll-behavior: none'],

  // object and aspect
  'object-contain': ['object-fit: contain'],
  'object-cover': ['object-fit: cover'],
  'object-fill': ['object-fit: fill'],
  'object-none': ['object-fit: none'],
  'object-scale-down': ['object-fit: scale-down'],
  'aspect-square': ['aspect-ratio: 1 / 1'],
  'aspect-video': ['aspect-ratio: 16 / 9'],
  'aspect-auto': ['aspect-ratio: auto'],

  // typography keywords
  'text-left': ['text-align: left'],
  'text-center': ['text-align: center'],
  'text-right': ['text-align: right'],
  'text-justify': ['text-align: justify'],
  'text-start': ['text-align: start'],
  'text-end': ['text-align: end'],
  'text-balance': ['text-wrap: balance'],
  'text-pretty': ['text-wrap: pretty'],
  'text-nowrap': ['text-wrap: nowrap'],
  'text-wrap': ['text-wrap: wrap'],
  uppercase: ['text-transform: uppercase'],
  lowercase: ['text-transform: lowercase'],
  capitalize: ['text-transform: capitalize'],
  'normal-case': ['text-transform: none'],
  italic: ['font-style: italic'],
  'not-italic': ['font-style: normal'],
  underline: ['text-decoration-line: underline'],
  'line-through': ['text-decoration-line: line-through'],
  'no-underline': ['text-decoration-line: none'],
  antialiased: ['-webkit-font-smoothing: antialiased', '-moz-osx-font-smoothing: grayscale'],
  truncate: ['overflow: hidden', 'text-overflow: ellipsis', 'white-space: nowrap'],
  // Numerals of one width, which is what stops a column of figures jittering as it changes.
  'tabular-nums': ['font-variant-numeric: tabular-nums'],
  'proportional-nums': ['font-variant-numeric: proportional-nums'],
  'whitespace-nowrap': ['white-space: nowrap'],
  'whitespace-pre-line': ['white-space: pre-line'],
  'break-words': ['overflow-wrap: break-word'],

  // effects and interaction keywords
  transition: [
    'transition-property: color, background-color, border-color, opacity, box-shadow, transform, filter, backdrop-filter',
    'transition-timing-function: var(--ms-ease-standard)',
    'transition-duration: var(--ms-duration-fast)',
  ],
  'transition-none': ['transition-property: none'],
  'transition-colors': [
    'transition-property: color, background-color, border-color',
    'transition-timing-function: var(--ms-ease-standard)',
    'transition-duration: var(--ms-duration-fast)',
  ],
  'transition-opacity': [
    'transition-property: opacity',
    'transition-timing-function: var(--ms-ease-standard)',
    'transition-duration: var(--ms-duration-fast)',
  ],
  'transition-transform': [
    'transition-property: transform',
    'transition-timing-function: var(--ms-ease-standard)',
    'transition-duration: var(--ms-duration-fast)',
  ],
  'transform-gpu': ['transform: translateZ(0)'],
  'select-none': ['user-select: none'],
  'select-text': ['user-select: text'],
  'pointer-events-none': ['pointer-events: none'],
  'pointer-events-auto': ['pointer-events: auto'],
  'appearance-none': ['appearance: none'],
  'align-middle': ['vertical-align: middle'],
  'mx-auto': ['margin-inline: auto'],
  'my-auto': ['margin-block: auto'],
  'w-full': ['width: 100%'],
  'w-screen': ['width: 100vw'],
  'w-auto': ['width: auto'],
  'h-full': ['height: 100%'],
  'h-screen': ['height: 100vh'],
  'h-auto': ['height: auto'],
  'min-h-screen': ['min-height: 100vh'],
  'max-w-full': ['max-width: 100%'],
  'max-w-none': ['max-width: none'],

  /**
   * `ACCESSIBILITY.md` § Visually hidden, and the one keyword whose declarations a reader is likely to
   * want to check: it has to stay focusable, which `display: none` would not.
   */
  'sr-only': [
    'position: absolute',
    'width: 1px',
    'height: 1px',
    'padding: 0',
    'margin: -1px',
    'overflow: hidden',
    'clip-path: inset(50%)',
    'white-space: nowrap',
    'border-width: 0',
  ],
}
