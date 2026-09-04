/**
 * Does the replacement for GSAP work in the three engines? — ADR-349.
 *
 * Two mechanisms are new and neither is provable by a unit test: a paused animation seeked by a
 * negative `animation-delay`, and a pinned track that clips with `overflow-x: clip`. This drives the
 * emitted CSS in Chrome, Firefox and WebKit and reads computed values back.
 *
 *   node verify-scrub.mjs      (from e2e/)
 */
import { createRequire } from 'node:module'

const require_ = createRequire(import.meta.url)
const { chromium, firefox, webkit } = require_('playwright-core')

const TIMELINE_CSS = `@keyframes ms-scroll-timeline-test {
  0% { opacity: 0 }
  50% { opacity: 1 }
  100% { opacity: 1; transform: translateY(-40px) }
}
.ms-scroll-timeline-test { animation: ms-scroll-timeline-test 1s linear paused both; animation-delay: calc(-1s * var(--ms-scroll-progress, 0)) }`

const HSCROLL_CSS = `.ms-hscroll { --ms-hscroll-distance: 1600px; display: flex; align-items: flex-start; height: calc(100vh + 1600px); overflow-x: clip }
.ms-hscroll > * { position: sticky; top: 0; flex: 0 0 auto; transform: translate3d(calc(var(--ms-hscroll-distance) * -1 * var(--ms-scroll-progress, 0)), 0, 0) }`

const PAGE = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  body { margin: 0 }
  #timeline { width: 200px; height: 100px; background: rebeccapurple }
  .card { width: 80vw; height: 300px; background: teal }
  ${TIMELINE_CSS}
  ${HSCROLL_CSS}
</style></head>
<body>
  <div class="ms-scroll-timeline-test" id="timeline"></div>
  <div class="ms-hscroll" id="track">
    <div class="card">one</div><div class="card">two</div><div class="card">three</div>
  </div>
  <div style="height: 200vh"></div>
</body></html>`

const read = async (page, progress) =>
  await page.evaluate((value) => {
    const timeline = document.querySelector('#timeline')
    const track = document.querySelector('#track')
    const card = track.firstElementChild

    timeline.style.setProperty('--ms-scroll-progress', String(value))
    track.style.setProperty('--ms-scroll-progress', String(value))

    const style = getComputedStyle(timeline)

    return {
      opacity: Number(style.opacity).toFixed(3),
      timelineTransform: style.transform,
      cardTransform: getComputedStyle(card).transform,
      cardTop: Math.round(card.getBoundingClientRect().top),
      pageScrollWidth: document.documentElement.scrollWidth,
      viewportWidth: window.innerWidth,
    }
  }, progress)

for (const [name, type, options] of [
  ['chrome', chromium, { channel: 'chrome' }],
  ['firefox', firefox, {}],
  ['webkit', webkit, {}],
]) {
  const browser = await type.launch(options)
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } })

  await page.setContent(PAGE)
  await page.waitForTimeout(200)

  const rows = []

  for (const progress of [0, 0.25, 0.5, 1]) {
    rows.push([progress, await read(page, progress)])
  }

  // Pinning: scroll past the top of the track and read where the card sits.
  await page.evaluate(() => window.scrollTo(0, 600))
  await page.waitForTimeout(100)

  const pinned = await read(page, 0.3)

  console.log(`\n${name}`)

  for (const [progress, row] of rows) {
    console.log(
      `  progress ${progress}: opacity ${row.opacity}, timeline ${row.timelineTransform}, card ${row.cardTransform}`,
    )
  }

  console.log(
    `  after scrolling 600px: card top ${pinned.cardTop} (pinned when 0), horizontal overflow ${
      pinned.pageScrollWidth > pinned.viewportWidth ? `yes (${pinned.pageScrollWidth}px)` : 'none'
    }`,
  )

  await browser.close()
}
