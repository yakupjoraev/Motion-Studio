/**
 * The vanilla `<script>` — prompt 44's feature table, one block per feature and nothing that is not
 * needed. Two rules decide where a block goes and they are the reason this file is a table rather than
 * one string:
 *
 * 1. **Animation sits inside the reduced-motion guard. Function sits outside it.** An accordion that
 *    stops opening because the reader asked for less motion is a broken page, not a considerate one.
 * 2. **A feature is emitted only when the document contains what it drives.** The size target is under
 *    3 kB for a landing page, and the way to hit it is to ship nothing speculative.
 *
 * The behavioural hooks are `data-ms-*` attributes rather than block ids, so the contract is readable
 * in the emitted HTML and a block that starts emitting one starts working here with no change to this
 * file — `EXPORT_ENGINE.md` § HTML, the behaviour contract.
 */
export type ScriptFeature =
  | 'reveal'
  | 'pointer'
  | 'sticky'
  | 'color-mode'
  | 'disclosure'
  | 'carousel'
  | 'menu'

/** The attribute each markup-driven feature looks for, so detection and emission cannot disagree. */
export const FEATURE_ATTRIBUTES: Readonly<Record<string, ScriptFeature>> = {
  'data-ms-color-mode-toggle': 'color-mode',
  'data-ms-disclosure': 'disclosure',
  'data-ms-carousel': 'carousel',
  'data-ms-menu': 'menu',
}

interface Block {
  readonly feature: ScriptFeature
  /** Animation goes inside `if (!reduced.matches)`; function goes outside it. */
  readonly animated: boolean
  readonly source: string
}

const REVEAL = `const revealed = document.querySelectorAll('.ms-reveal')
if (reduced.matches) {
  revealed.forEach((node) => node.classList.add('is-visible'))
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      })
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.2 },
  )
  revealed.forEach((node) => observer.observe(node))
}`

const POINTER = `const tracked = document.querySelectorAll('.ms-pointer')
if (tracked.length) {
  addEventListener(
    'pointermove',
    (event) => {
      tracked.forEach((node) => {
        const box = node.getBoundingClientRect()
        node.style.setProperty('--ms-pointer-x', ((event.clientX - box.left) / box.width).toFixed(3))
        node.style.setProperty('--ms-pointer-y', ((event.clientY - box.top) / box.height).toFixed(3))
      })
    },
    { passive: true },
  )
}`

const STICKY = `const stacked = new IntersectionObserver(
  (entries) => entries.forEach((entry) => entry.target.classList.toggle('is-stuck', entry.intersectionRatio < 1)),
  { threshold: [1] },
)
document.querySelectorAll('.ms-sticky').forEach((node) => stacked.observe(node))`

const COLOR_MODE = `document.querySelectorAll('[data-ms-color-mode-toggle]').forEach((button) => {
  button.addEventListener('click', () => {
    const next = root.dataset.colorMode === 'dark' ? 'light' : 'dark'
    root.dataset.colorMode = next
    button.setAttribute('aria-pressed', String(next === 'dark'))
    store(next)
  })
})`

/**
 * One delegated listener per container rather than one per header: a document with forty questions
 * still installs one handler, and a container whose contents are replaced keeps working.
 */
const DISCLOSURE = `document.querySelectorAll('[data-ms-disclosure]').forEach((group) => {
  group.addEventListener('click', (event) => {
    const trigger = event.target.closest('[aria-controls]')
    if (!trigger || !group.contains(trigger)) return
    const panel = document.getElementById(trigger.getAttribute('aria-controls'))
    if (!panel) return
    const open = trigger.getAttribute('aria-expanded') === 'true'
    if (group.dataset.msDisclosure === 'single') {
      group.querySelectorAll('[aria-controls]').forEach((other) => {
        other.setAttribute('aria-expanded', 'false')
        const owned = document.getElementById(other.getAttribute('aria-controls'))
        if (owned) owned.hidden = true
      })
    }
    trigger.setAttribute('aria-expanded', String(!open))
    panel.hidden = open
  })
})`

/** Scroll-snap does the carousel; the arrows only move it, which is why there is no index to keep. */
const CAROUSEL = `document.querySelectorAll('[data-ms-carousel]').forEach((carousel) => {
  const track = carousel.querySelector('[data-ms-carousel-track]') || carousel
  carousel.querySelectorAll('[data-ms-carousel-step]').forEach((button) => {
    button.addEventListener('click', () => {
      const step = Number(button.dataset.msCarouselStep) * track.clientWidth
      track.scrollBy({ left: step, behavior: reduced.matches ? 'auto' : 'smooth' })
    })
  })
})`

const MENU = `document.querySelectorAll('[data-ms-menu]').forEach((menu) => {
  const trigger = menu.querySelector('[data-ms-menu-trigger]')
  const panel = menu.querySelector('[data-ms-menu-panel]')
  if (!trigger || !panel) return
  const focusable = () => panel.querySelectorAll('a[href], button:not([disabled]), [tabindex="0"]')
  const setOpen = (open) => {
    trigger.setAttribute('aria-expanded', String(open))
    panel.hidden = !open
    menu.classList.toggle('is-open', open)
    if (open) focusable()[0]?.focus()
    else trigger.focus()
  }
  trigger.addEventListener('click', () => setOpen(trigger.getAttribute('aria-expanded') !== 'true'))
  menu.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') return setOpen(false)
    if (event.key !== 'Tab' || panel.hidden) return
    const items = [...focusable()]
    const edge = event.shiftKey ? items[0] : items[items.length - 1]
    if (document.activeElement !== edge) return
    event.preventDefault()
    ;(event.shiftKey ? items[items.length - 1] : items[0]).focus()
  })
})`

const BLOCKS: readonly Block[] = [
  { feature: 'reveal', animated: false, source: REVEAL },
  { feature: 'pointer', animated: true, source: POINTER },
  { feature: 'sticky', animated: true, source: STICKY },
  { feature: 'color-mode', animated: false, source: COLOR_MODE },
  { feature: 'disclosure', animated: false, source: DISCLOSURE },
  { feature: 'carousel', animated: false, source: CAROUSEL },
  { feature: 'menu', animated: false, source: MENU },
]

const indent = (source: string, pad: string): string =>
  source
    .split('\n')
    .map((line) => (line === '' ? line : `${pad}${line}`))
    .join('\n')

export interface ScriptInput {
  readonly features: ReadonlySet<ScriptFeature>
  /** `COLOR_MODE_STORAGE_KEY`, injected the way the stylesheet is — ADR-232. */
  readonly colorModeStorageKey?: string | undefined
}

/**
 * `undefined` when the document needs no script at all, which is the answer for a static page and the
 * one the size target is measured against.
 *
 * `reveal` reads the reduced-motion preference itself rather than sitting inside the guard: it has an
 * else branch, because the elements start hidden and something has to show them.
 */
export function printScripts(input: ScriptInput): string | undefined {
  const selected = BLOCKS.filter((block) => input.features.has(block.feature))

  if (selected.length === 0) {
    return undefined
  }

  const functional = selected.filter((block) => !block.animated)
  const animated = selected.filter((block) => block.animated)
  const needsRoot = input.features.has('color-mode')
  const body = [
    "const reduced = matchMedia('(prefers-reduced-motion: reduce)')",
    ...(needsRoot ? ['const root = document.documentElement', storeFunction(input)] : []),
    ...functional.map((block) => block.source),
    ...(animated.length === 0
      ? []
      : [`if (!reduced.matches) {\n${indent(animated.map((b) => b.source).join('\n'), '  ')}\n}`]),
  ]

  return `;(() => {\n${indent(body.join('\n\n'), '  ')}\n})()`
}

/**
 * Persistence needs the key the theme's blocking script reads, and `codegen` does not hold it. Absent,
 * the toggle still flips the attribute — the export warns that the choice will not survive a reload
 * rather than inventing a key that would silently disagree with the script above it.
 */
function storeFunction(input: ScriptInput): string {
  return input.colorModeStorageKey === undefined
    ? 'const store = () => {}'
    : `const store = (mode) => {
  try {
    localStorage.setItem('${input.colorModeStorageKey}', mode)
  } catch (error) {}
}`
}
