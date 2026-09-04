import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { firefox, webkit, chromium } = require('playwright-core')

const ORIGIN = process.argv[2] ?? 'https://motion-studio-y3dev.vercel.app'

const probe = async (name, launcher, options = {}) => {
  const browser = await launcher.launch(options)
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

  await page.goto(`${ORIGIN}/`, { waitUntil: 'networkidle' })

  const support = await page.evaluate(() => {
    const backdrop = [...document.querySelectorAll('*')].filter((element) => {
      const style = getComputedStyle(element)
      return style.backdropFilter !== 'none' && style.backdropFilter !== ''
    })

    const swatch = document.createElement('div')
    swatch.style.color = 'oklch(0.7 0.15 250)'
    document.body.append(swatch)
    const resolved = getComputedStyle(swatch).color
    swatch.remove()

    const snapped = [...document.querySelectorAll('*')].filter(
      (element) => getComputedStyle(element).scrollSnapType !== 'none',
    ).length

    const clipped = [...document.querySelectorAll('*')].filter(
      (element) => getComputedStyle(element).clipPath !== 'none',
    ).length

    return {
      backdropSupported: CSS.supports('backdrop-filter', 'blur(4px)'),
      backdropElements: backdrop.length,
      oklchSupported: CSS.supports('color', 'oklch(0.7 0.15 250)'),
      oklchResolved: resolved,
      scrollSnapElements: snapped,
      clipPathElements: clipped,
      intersectionObserver: typeof IntersectionObserver === 'function',
      observerThresholds:
        typeof IntersectionObserver === 'function'
          ? new IntersectionObserver(() => {}, { threshold: [0, 0.25, 1] }).thresholds.length
          : 0,
      scrollTimeline: CSS.supports('animation-timeline', 'scroll()'),
    }
  })

  await page.goto(`${ORIGIN}/studio`, { waitUntil: 'networkidle' })
  await page.waitForSelector('[data-testid="canvas-root"]', { timeout: 60_000 })

  const studio = await page.evaluate(() => ({
    canvas: document.querySelector('[data-testid="canvas-root"]') !== null,
    panels: document.querySelectorAll('[data-testid$="-panel"]').length,
    width: document.documentElement.clientWidth,
  }))

  await page.setViewportSize({ width: 1280, height: 800 })
  await page.waitForTimeout(500)

  const narrow = await page.evaluate(() => ({
    horizontalOverflow: document.documentElement.scrollWidth > document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }))

  await browser.close()

  console.log(`--- ${name} ---`)
  console.log(JSON.stringify({ ...support, studio, narrow }, null, 1))
}

await probe('chrome', chromium, { channel: 'chrome' })
await probe('firefox', firefox)
await probe('webkit', webkit)
