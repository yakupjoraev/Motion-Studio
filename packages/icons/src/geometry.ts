/**
 * Every glyph in the set, as data — ADR-250.
 *
 * It is a table rather than JSX because two consumers need it and only one of them can render React:
 * `createIcon` builds the components from it, and `packages/blocks` reads it to emit an inline `<svg>`
 * into an exported page, which may not depend on this package at all.
 */

/** The contract `DESIGN_SYSTEM.md` § Iconography states, in the one place both consumers read it from. */
export const ICON_SVG_ATTRIBUTES = {
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
} as const

export interface IconPath {
  readonly tag: 'path'
  readonly d: string
  readonly strokeDasharray?: string
  /** Filled in `currentColor` with no stroke — a dot, a wedge, a solid half. */
  readonly filled?: true
}

export interface IconCircle {
  readonly tag: 'circle'
  readonly cx: number
  readonly cy: number
  readonly r: number
  readonly filled?: true
}

export type IconShape = IconPath | IconCircle

const path = (d: string): IconShape => ({ tag: 'path', d })

const dashed = (d: string, strokeDasharray: string): IconShape => ({
  tag: 'path',
  d,
  strokeDasharray,
})

const filled = (d: string): IconShape => ({ tag: 'path', d, filled: true })

const circle = (cx: number, cy: number, r: number): IconShape => ({ tag: 'circle', cx, cy, r })

const dot = (cx: number, cy: number, r: number): IconShape => ({
  tag: 'circle',
  cx,
  cy,
  r,
  filled: true,
})

/**
 * The set, in the order `registry.test.tsx` groups it: editor, layout, style, motion, navigation,
 * blocks, files, status, theme. `IconName` is derived from these keys, so this table is what "the icon
 * set" means — a component with no entry here does not typecheck.
 */
export const ICON_GEOMETRY = {
  cursor: [path('M5 3L16 10L11 11L13.5 15.8L11.7 16.7L9.2 11.9L5 15Z')],
  hand: [
    path(
      'M7 10V4.6a1.3 1.3 0 0 1 2.6 0V9m0-.9a1.3 1.3 0 0 1 2.6 0V10m0-1.2a1.3 1.3 0 0 1 2.6 0v3.7a4.5 4.5 0 0 1-4.5 4.5H10a4 4 0 0 1-3.1-1.5L4.6 12a1.3 1.3 0 0 1 2-1.7L7 11',
    ),
  ],
  move: [
    path(
      'M10 3v14M3 10h14M10 3 7.5 5.5M10 3l2.5 2.5M10 17l-2.5-2.5M10 17l2.5-2.5M3 10l2.5-2.5M3 10l2.5 2.5M17 10l-2.5-2.5M17 10l-2.5 2.5',
    ),
  ],
  resize: [path('M12 4h4v4M8 16H4v-4M16 4l-5.5 5.5M4 16l5.5-5.5')],
  duplicate: [path('M7 3h10v10'), path('M3 7h10v10H3z'), path('M8 12h4M10 10v4')],
  delete: [path('M4 6h12M8 6V4h4v2M5.8 6l.9 10.1h6.6L14.2 6M8.6 9v4.5M11.4 9v4.5')],
  lock: [path('M6.5 9V7a3.5 3.5 0 0 1 7 0v2'), path('M5 9h10v8H5z')],
  unlock: [path('M6.5 9V7a3.5 3.5 0 0 1 6.6-1.7'), path('M5 9h10v8H5z')],
  eye: [
    path('M2.5 10S5.5 4.8 10 4.8 17.5 10 17.5 10 14.5 15.2 10 15.2 2.5 10 2.5 10z'),
    circle(10, 10, 2.4),
  ],
  'eye-off': [
    path(
      'M4.4 6.4C3.1 7.7 2.5 10 2.5 10s3 5.2 7.5 5.2c1.2 0 2.3-.3 3.2-.9M8 5.1c.6-.2 1.3-.3 2-.3 4.5 0 7.5 5.2 7.5 5.2s-.7 1.2-1.9 2.5M8.4 8.4a2.4 2.4 0 0 0 3.3 3.4M4 4l12 12',
    ),
  ],
  undo: [path('M7 5.5 3.5 9 7 12.5M3.5 9h8.2a4.4 4.4 0 0 1 0 8.8H7.5')],
  redo: [path('M13 5.5 16.5 9 13 12.5M16.5 9H8.3a4.4 4.4 0 0 0 0 8.8h4.2')],
  copy: [path('M7 7h10v10H7z'), path('M13 7V3H3v10h4')],
  paste: [path('M7.5 3h5v3h-5z'), path('M7.5 4.5H4.5v13h11v-13h-3')],
  scissors: [circle(6, 15, 2.3), circle(14, 15, 2.3), path('M7.6 13.4 15 3M12.4 13.4 5 3')],
  group: [path('M4 7V4h3M13 4h3v3M16 13v3h-3M7 16H4v-3'), path('M8 8h4v4H8z')],
  ungroup: [path('M3 6V3h3M11 3h3v3'), path('M3 11h6v6H3z'), path('M11 9h6v6h-6z')],
  'layout-grid': [path('M3 3h6v6H3zM11 3h6v6h-6zM3 11h6v6H3zM11 11h6v6h-6z')],
  'layout-columns': [path('M3 3h14v14H3z'), path('M10 3v14')],
  'layout-rows': [path('M3 3h14v14H3z'), path('M3 10h14')],
  'align-left': [path('M3 3v14'), path('M6 7h9M6 13h5.5')],
  'align-center-h': [dashed('M10 3v14', '1.6 2'), path('M4 7h12M6.5 13h7')],
  'align-right': [path('M17 3v14'), path('M5 7h9M8.5 13h5.5')],
  'align-top': [path('M3 3h14'), path('M7 6v9M13 6v5.5')],
  'align-center-v': [dashed('M3 10h14', '1.6 2'), path('M7 4v12M13 6.5v7')],
  'align-bottom': [path('M3 17h14'), path('M7 5v9M13 8.5v5.5')],
  'distribute-h': [path('M3 3v14M17 3v14'), path('M8.5 6h3v8h-3z')],
  'distribute-v': [path('M3 3h14M3 17h14'), path('M6 8.5h8v3H6z')],
  padding: [path('M3 3h14v14H3z'), dashed('M6.5 6.5h7v7h-7z', '1.6 2')],
  margin: [dashed('M3 3h14v14H3z', '1.6 2'), path('M6.5 6.5h7v7h-7z')],
  gap: [path('M3 4.5h5v11H3zM12 4.5h5v11h-5z'), path('M9.2 10h1.6')],
  palette: [circle(10, 10, 7), dot(7.3, 8, 1), dot(10, 6.6, 1), dot(12.7, 8, 1), dot(10, 13, 1.4)],
  droplet: [path('M10 3.2s5 5.4 5 8.3a5 5 0 0 1-10 0c0-2.9 5-8.3 5-8.3z')],
  gradient: [path('M3 3h14v14H3z'), path('M3 11.5 11.5 3M6.5 17 17 6.5M12 17l5-5')],
  blur: [circle(10, 10, 7), dashed('M10 3a7 7 0 0 0 0 14', '1.5 2.2')],
  shadow: [path('M4 4h9v9H4z'), dashed('M7.5 16.5h9v-9', '1.6 2')],
  border: [path('M4 4h12v12H4z'), path('M8 4h4M4 8v4M16 8v4M8 16h4')],
  radius: [path('M4 17V9.5A5.5 5.5 0 0 1 9.5 4H17'), dashed('M4 4h5.5M4 4v5.5', '1.6 2')],
  opacity: [circle(10, 10, 7), filled('M10 3a7 7 0 0 1 0 14z')],
  type: [path('M4 5.5V4h12v1.5M10 4v12M7.5 16h5')],
  sparkles: [
    path('M7.6 3 8.8 6.2 12 7.4 8.8 8.6 7.6 11.8 6.4 8.6 3.2 7.4 6.4 6.2z'),
    path('M14.4 11.6l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z'),
  ],
  noise: [
    dot(5.5, 5.5, 1.4),
    dot(11, 4.4, 1.4),
    dot(15.5, 7, 1.4),
    dot(7.6, 9.8, 1.4),
    dot(13, 11.4, 1.4),
    dot(4.5, 13.6, 1.4),
    dot(9.6, 15.2, 1.4),
    dot(15.2, 15.4, 1.4),
  ],
  play: [path('M6 4.2 16 10 6 15.8z')],
  pause: [path('M7.2 4v12M12.8 4v12')],
  replay: [path('M16.5 10a6.5 6.5 0 1 1-2.6-5.2'), path('M16.5 3.2v2.4h-2.4')],
  zap: [path('M11.4 2.5 5 10.6h4.2L8.6 17.5 15 9.4h-4.2z')],
  wave: [path('M3 10c1.2-6 2.3 6 3.5 0S8.8 16 10 10s2.3 6 3.5 0S15.8 16 17 10')],
  spring: [path('M6 3h8M6 17h8M7 3.6l6 3.3-6 3.2 6 3.3-6 3.2')],
  curve: [path('M3.5 16.5C3.5 8.5 10 4 16.5 4'), dot(3.5, 16.5, 1.4), dot(16.5, 4, 1.4)],
  timeline: [path('M3 5h14M3 10h14M3 15h14'), path('M7 3.6v2.8M12.5 8.6v2.8M9 13.6v2.8')],
  'cursor-follow': [
    path('M9 8.5 17 13.5 13.2 14.2 14.9 17.5 13.5 18 11.9 14.8 9 16.6Z'),
    dashed('M3 3.5c.8 2.4 2 4 3.6 5', '1.6 2'),
  ],
  'chevron-up': [path('M5 12.2 10 7.2l5 5')],
  'chevron-down': [path('M5 7.8 10 12.8l5-5')],
  'chevron-left': [path('M12.2 5 7.2 10l5 5')],
  'chevron-right': [path('M7.8 5 12.8 10l-5 5')],
  plus: [path('M10 4v12M4 10h12')],
  minus: [path('M4 10h12')],
  menu: [path('M3.5 5.5h13M3.5 10h13M3.5 14.5h13')],
  x: [path('M5.2 5.2 14.8 14.8M14.8 5.2 5.2 14.8')],
  check: [path('M4.2 10.6 8 14.4l7.8-8.8')],
  search: [circle(9, 9, 5.4), path('M12.9 12.9 17 17')],
  settings: [
    circle(10, 10, 3),
    path(
      'M10 2.5v2M10 15.5v2M2.5 10h2M15.5 10h2M4.7 4.7 6.1 6.1M13.9 13.9l1.4 1.4M15.3 4.7 13.9 6.1M6.1 13.9 4.7 15.3',
    ),
  ],
  'more-horizontal': [dot(4.8, 10, 1.3), dot(10, 10, 1.3), dot(15.2, 10, 1.3)],
  'more-vertical': [dot(10, 4.8, 1.3), dot(10, 10, 1.3), dot(10, 15.2, 1.3)],
  'external-link': [
    path('M11.5 3.5H16.5v5M16.5 3.5 10 10'),
    path('M14 11.5v4A1.5 1.5 0 0 1 12.5 17h-8A1.5 1.5 0 0 1 3 15.5v-8A1.5 1.5 0 0 1 4.5 6h4'),
  ],
  'panel-left': [path('M3 3h14v14H3z'), path('M8 3v14')],
  'panel-right': [path('M3 3h14v14H3z'), path('M12 3v14')],
  hero: [path('M3 3h14v14H3z'), path('M3 8.5h14M6 11.5h8M6 14.2h5')],
  grid: [path('M3 3h14v14H3z'), path('M7.7 3v14M12.3 3v14M3 7.7h14M3 12.3h14')],
  card: [path('M4 4h12v12H4z'), path('M4 9.5h12M7 12.5h6')],
  list: [path('M4 5h1.2M8 5h8M4 10h1.2M8 10h8M4 15h1.2M8 15h8')],
  table: [path('M3 4h14v12H3z'), path('M3 8h14M8 8v8M13 8v8')],
  form: [path('M3 4h14v4H3zM3 12h14v4H3z'), path('M5.2 6h4M5.2 14h6')],
  navbar: [
    path('M3 4h14v4H3z'),
    path('M5.6 6h2.2M10.2 6h2.2M14.4 6h1'),
    dashed('M3 11h14v6H3z', '1.6 2'),
  ],
  footer: [path('M3 3h14v14H3z'), path('M3 13h14')],
  image: [path('M3 4h14v12H3z'), circle(7.4, 8, 1.5), path('M3 14.2 7.2 10l2.8 2.8L13 9.8l4 4.4')],
  video: [path('M3 4h14v12H3z'), path('M8.4 7.2 12.8 10l-4.4 2.8z')],
  code: [path('M7 5.8 3 10l4 4.2M13 5.8 17 10l-4 4.2')],
  file: [
    path('M11 3H6a1.5 1.5 0 0 0-1.5 1.5v11A1.5 1.5 0 0 0 6 17h8a1.5 1.5 0 0 0 1.5-1.5V7.5z'),
    path('M11 3v4.5h4.5'),
  ],
  folder: [
    path(
      'M3 6.5A1.5 1.5 0 0 1 4.5 5h3.1l2 2h5.9A1.5 1.5 0 0 1 17 8.5v6A1.5 1.5 0 0 1 15.5 16h-11A1.5 1.5 0 0 1 3 14.5z',
    ),
  ],
  download: [path('M10 3v9M6.5 8.5 10 12l3.5-3.5M4 16h12')],
  upload: [path('M4 13v2.5A1.5 1.5 0 0 0 5.5 17h9a1.5 1.5 0 0 0 1.5-1.5V13M10 3v9M7 9l3 3 3-3')],
  save: [path('M4 4h9l3 3v9H4z'), path('M7 4v4h6M7 16v-4h6v4')],
  export: [path('M4 13v2.5A1.5 1.5 0 0 0 5.5 17h9a1.5 1.5 0 0 0 1.5-1.5V13M10 12V3M7 6l3-3 3 3')],
  history: [path('M3.5 10a6.5 6.5 0 1 0 2.6-5.2'), path('M3.5 3.2v2.4h2.4M10 6.8v3.6l2.6 1.5')],
  info: [circle(10, 10, 7), path('M10 9v4.6M10 6.6h.01')],
  warning: [path('M10 3.4 17.4 16.6H2.6z'), path('M10 8v3.6M10 14.1h.01')],
  error: [circle(10, 10, 7), path('M7.6 7.6l4.8 4.8M12.4 7.6l-4.8 4.8')],
  success: [circle(10, 10, 7), path('M6.8 10.3 9.2 12.7l4.4-5')],
  loading: [path('M17 10a7 7 0 1 1-7-7')],
  sun: [
    circle(10, 10, 3.4),
    path(
      'M10 2.6v1.8M10 15.6v1.8M2.6 10h1.8M15.6 10h1.8M4.8 4.8l1.3 1.3M13.9 13.9l1.3 1.3M15.2 4.8l-1.3 1.3M6.1 13.9l-1.3 1.3',
    ),
  ],
  /** One closed path, so the crescent reads as a shape at 16 px rather than as two arcs that nearly meet. */
  moon: [path('M15.6 12.2A6.7 6.7 0 0 1 7.8 4.4 6.9 6.9 0 1 0 15.6 12.2z')],
  /** The glyph for "whatever the system says", which is why it is a screen and not a third weather symbol. */
  monitor: [path('M3 4.2h14v9H3z'), path('M7.4 16.8h5.2M10 13.2v3.6')],
} as const satisfies Readonly<Record<string, readonly IconShape[]>>
