import { z } from 'zod'

import { definePreset } from '../../model/define-preset'
import { sliderControl, switchControl } from '../shared'

import { ON_SCROLL } from './progress'

const CLASS = 'ms-hscroll'

/**
 * The track's travel, from the one custom property the shared scroll bus writes. Applied to the
 * children rather than to the element, because the element is the window: it clips with
 * `overflow-x: clip` — not `hidden`, which would make it a scroll container and take the pin's
 * sticky children out of the page's scrollport — and the children are what moves inside it.
 */
const track = (): string =>
  `.${CLASS} { display: flex; align-items: flex-start; overflow-x: clip }
.${CLASS} > * { flex: 0 0 auto; transform: translate3d(calc(var(--ms-hscroll-distance) * -1 * var(--ms-scroll-progress, 0)), 0, 0) }`

/**
 * The same track, plus the pin the export needs and the studio does not. `position: sticky` holds
 * each card at the top of the viewport while the element — tall by `distance` — is scrolled past, so
 * the runway is the element's own height rather than a spacer inserted around it.
 */
const pinned = (distance: number): string =>
  `.${CLASS} { --ms-hscroll-distance: ${distance}px; display: flex; align-items: flex-start; height: calc(100vh + ${distance}px); overflow-x: clip }
.${CLASS} > * { position: sticky; top: 0; flex: 0 0 auto; transform: translate3d(calc(var(--ms-hscroll-distance) * -1 * var(--ms-scroll-progress, 0)), 0, 0) }`

/**
 * Vertical scrolling, spent sideways: the track travels by `distance` across the range the section
 * occupies.
 *
 * Engine `css`, on the mechanism every other scroll preset uses — the bus writes
 * `--ms-scroll-progress` once per frame for every subscriber and the transform is one `calc`. `snap`
 * is an export-side property: it needs the number of cards, the export measures it on mount, and the
 * studio's canvas is not the page scroller (ADR-349).
 */
export const horizontalScroll = definePreset({
  id: 'horizontal-scroll',
  name: 'Horizontal scroll',
  channel: 'scroll',
  engine: 'css',
  paramsSchema: z.object({
    distance: z.number().min(200).max(6000).default(1600),
    snap: z.boolean().default(false),
  }),
  defaults: { distance: 1600, snap: false },
  controls: [
    sliderControl('distance', 'Distance', 200, 6000, { step: 50, unit: 'px' }),
    switchControl('snap', 'Snap'),
  ],
  capabilities: { composableWith: ['hover', 'cursor'], requiresChildren: true, cost: 'heavy' },
  resolve: (params) => ({
    engine: 'css',
    className: CLASS,
    properties: ['transform'],
    cssVars: {
      '--ms-hscroll-distance': `${params.distance}px`,
      '--ms-scroll-progress': '0',
    },
    transition: { duration: 0 },
    listeners: ON_SCROLL,
    keyframes: track(),
  }),
  /** The track, at its start, scrollable by hand. No travel and no pin. */
  resolveReduced: () => ({
    engine: 'css',
    variants: { end: { x: 0 } },
    transition: { duration: 0 },
  }),
  codegen: (params) => ({
    imports: [
      { from: 'motion/react', named: ['useScroll'] },
      { from: 'react', named: ['useEffect', 'useRef'] },
    ],
    classNames: [CLASS],
    css: pinned(params.distance),
    hooks: [
      'const trackRef = useRef<HTMLDivElement | null>(null)',
      "const { scrollYProgress } = useScroll({ target: trackRef, offset: ['start start', 'end end'] })",
      `useEffect(() => {
  const track = trackRef.current

  if (track === null || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    return
  }
${
  params.snap
    ? `
  // One stop per gap between cards, which is where the track can come to rest.
  const stops = Math.max(track.children.length - 1, 1)
`
    : ''
}
  return scrollYProgress.on('change', (progress) => {
    track.style.setProperty(
      '--ms-scroll-progress',
      String(${params.snap ? 'Math.round(progress * stops) / stops' : 'progress'}),
    )
  })
}, [scrollYProgress])`,
    ],
    wrapper: { tag: 'div', props: { ref: '{trackRef}' } },
  }),
})
