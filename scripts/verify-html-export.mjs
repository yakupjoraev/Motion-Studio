import { existsSync, readFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

import { connect, launchChrome } from './thumbnails/browser.mjs'

/**
 * The manual proof prompt 44 asks for, made repeatable: open an HTML export from the filesystem in a
 * real Chrome, with no server, and report what it actually does.
 *
 * ```
 * pnpm verify:html-export <landing/index.html> [hooks/index.html] [axe.min.js]
 * ```
 *
 * The second file is an export of the `interactive-hooks` document, whose script carries the
 * disclosure, menu and colour-mode blocks; the landing export's does not, because no shipped block
 * emits the `data-ms-*` attributes yet. The third is optional: axe-core is not a dependency of this
 * repository, so the audit below covers what a page can check about itself and says so.
 *
 * It uses `thumbnails/browser.mjs` rather than Playwright for ADR-125's reason, and because that
 * client already knows how to find the Chrome on this machine.
 */
const file = process.argv[2]
const hooksFile = process.argv[3]
const axePath = process.argv[4]
const url = pathToFileURL(file).href
const axe = axePath !== undefined && existsSync(axePath) ? readFileSync(axePath, 'utf8') : undefined

const report = []
const say = (label, value) => report.push(`${label}: ${value}`)

const COLLECT = `;(() => {
  window.__errors = []
  window.__requests = []
  addEventListener('error', (event) => window.__errors.push(String(event.message)))
  addEventListener('unhandledrejection', (event) => window.__errors.push(String(event.reason)))
  const native = console.error
  console.error = (...args) => { window.__errors.push(args.join(' ')); native(...args) }
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) window.__requests.push(entry.name)
  }).observe({ type: 'resource', buffered: true })
})()`

let collectorInstalled = false

const chrome = await launchChrome({ port: 9333 })
const page = await connect(chrome.webSocketDebuggerUrl)

async function load({ reduced = false, mobile = false, url: target = url } = {}) {
  await page.call('Emulation.setEmulatedMedia', {
    features: reduced ? [{ name: 'prefers-reduced-motion', value: 'reduce' }] : [],
  })

  if (mobile) {
    await page.call('Emulation.setDeviceMetricsOverride', {
      width: 393,
      height: 851,
      deviceScaleFactor: 1,
      mobile: true,
    })
  } else {
    await page.call('Emulation.clearDeviceMetricsOverride').catch(() => undefined)
  }

  if (!collectorInstalled) {
    await page.call('Page.addScriptToEvaluateOnNewDocument', { source: COLLECT })
    collectorInstalled = true
  }

  await page.call('Page.navigate', { url: target })

  // A navigation to the same URL is a no-op for `readyState`, so give the load a beat to start.
  await new Promise((resolve) => setTimeout(resolve, 300))

  await page.waitFor(
    async () => (await page.evaluate('document.readyState')) === 'complete',
    15_000,
    'the document to finish loading',
  )
}

// ── 1. Plain load, straight off the filesystem ────────────────────────────────
await load()

say('console errors', JSON.stringify(await page.evaluate('window.__errors')))
say(
  'off-file requests',
  JSON.stringify(
    await page.evaluate("(window.__requests ?? []).filter((url) => !url.startsWith('file:'))"),
  ),
)

const parsed = await page.evaluate(`(() => ({
  doctype: document.doctype ? document.doctype.name : null,
  lang: document.documentElement.lang,
  mode: document.documentElement.dataset.colorMode ?? null,
  title: document.title,
  unknown: [...document.querySelectorAll('*')]
    .map((node) => node.tagName.toLowerCase())
    .filter((tag) => document.createElement(tag).constructor.name === 'HTMLUnknownElement'),
  images: [...document.images].map((image) => ({ alt: image.alt, loading: image.loading })),
  landmarks: [...document.querySelectorAll('main, nav, section, article')].length,
  ldjson: [...document.querySelectorAll('script[type="application/ld+json"]')].map((node) => {
    try { JSON.parse(node.textContent ?? ''); return 'valid' } catch (error) { return 'invalid' }
  }),
}))()`)

say('doctype / lang / mode', `${parsed.doctype} / ${parsed.lang} / ${parsed.mode}`)
say('title', parsed.title)
say('unknown elements', parsed.unknown.length === 0 ? 'none' : parsed.unknown.join(', '))
say('landmarks', String(parsed.landmarks))
say('images', JSON.stringify(parsed.images))
say('ld+json', parsed.ldjson.join(', ') || 'none')

const computed = await page.evaluate(`(() => {
  const section = document.querySelector('.px-8') ?? document.querySelector('.px-6')
  const card = document.querySelector('.rounded-xl')
  const root = getComputedStyle(document.documentElement)

  return {
    paddingInline: section ? getComputedStyle(section).paddingInline : null,
    radius: card ? getComputedStyle(card).borderRadius : null,
    cardBackground: card ? getComputedStyle(card).backgroundColor : null,
    bodyBackground: getComputedStyle(document.body).backgroundColor,
    accent: root.getPropertyValue('--ms-color-accent').trim(),
    space8: root.getPropertyValue('--ms-space-8').trim(),
  }
})()`)

say('computed', JSON.stringify(computed))

const reveal = await page.evaluate(`(async () => {
  const node = document.querySelector('.ms-reveal')
  if (!node) return 'no .ms-reveal element'
  const before = getComputedStyle(node).opacity
  node.scrollIntoView()
  await new Promise((resolve) => setTimeout(resolve, 900))
  return before + ' -> ' + getComputedStyle(node).opacity +
    ' (is-visible ' + (node.classList.contains('is-visible') ? 'added' : 'missing') + ')'
})()`)

say('entrance', reveal)

// The checks a validator and an axe run would make, done in the page. Neither tool is installed and
// neither can be fetched here, so this is what the claim rests on — and it says exactly what it covers.
const audit = await page.evaluate(`(() => {
  const ids = [...document.querySelectorAll('[id]')].map((node) => node.id)
  const named = (node) =>
    (node.textContent ?? '').trim() !== '' ||
    node.getAttribute('aria-label') !== null ||
    node.getAttribute('aria-labelledby') !== null ||
    node.getAttribute('title') !== null

  return {
    duplicateIds: ids.filter((id, index) => ids.indexOf(id) !== index),
    unnamedControls: [...document.querySelectorAll('button, a[href]')].filter((node) => !named(node)).length,
    controls: document.querySelectorAll('button, a[href]').length,
    imagesWithoutAlt: [...document.images].filter((image) => !image.hasAttribute('alt')).length,
    headings: [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map((node) => node.tagName),
    ariaControlsResolve: [...document.querySelectorAll('[aria-controls]')].every((node) =>
      document.getElementById(node.getAttribute('aria-controls')) !== null,
    ),
    // A repaired document has elements the parser moved or inserted; a clean one round-trips.
    reparse: (() => {
      const tags = (root) => [...root.querySelectorAll('*')].map((node) => node.tagName).sort()
      const live = tags(document)
      const again = tags(new DOMParser().parseFromString(document.documentElement.outerHTML, 'text/html'))
      const extra = again.filter((tag, index) => live[index] !== tag)

      return live.length === again.length ? 'identical' : 'differs by ' + (again.length - live.length) +
        ': ' + [...new Set(extra)].join(', ')
    })(),
  }
})()`)

say('duplicate ids', audit.duplicateIds.length === 0 ? 'none' : audit.duplicateIds.join(', '))
say('controls without an accessible name', `${audit.unnamedControls} of ${audit.controls}`)
say('images without alt', String(audit.imagesWithoutAlt))
say('headings', audit.headings.join(', ') || 'none')
say('aria-controls all resolve', String(audit.ariaControlsResolve))
say('parser round-trips without repair', String(audit.reparse))

if (axe !== undefined) {
  await page.evaluate(axe)
  const violations = await page.evaluate(`(async () => {
    const result = await axe.run(document, { resultTypes: ['violations'] })
    return result.violations.map((entry) => entry.id + ' (' + entry.impact + ', ' + entry.nodes.length + ')')
  })()`)

  say('axe violations', violations.length === 0 ? 'none' : violations.join(', '))
}

// ── 2. Reduced motion ─────────────────────────────────────────────────────────
await load({ reduced: true })

say(
  'reduced motion',
  await page.evaluate(`(() => {
    const node = document.querySelector('.ms-reveal')
    if (!node) return 'no .ms-reveal element'
    const style = getComputedStyle(node)
    return 'opacity ' + style.opacity + ', transition ' + style.transitionProperty
  })()`),
)

// ── 3. Mobile viewport ────────────────────────────────────────────────────────
await load({ mobile: true })

say(
  'mobile overflow',
  await page.evaluate(
    'document.documentElement.scrollWidth - document.documentElement.clientWidth + "px"',
  ),
)

// ── 4. The data-ms-* contract, driven against the export that emits it ───────
if (hooksFile !== undefined) {
  for (const reduced of [false, true]) {
    await load({ reduced, url: pathToFileURL(hooksFile).href })

    const result = await page.evaluate(`(async () => {
      const tick = () => new Promise((resolve) => setTimeout(resolve, 60))
      const first = document.querySelector('[data-ms-disclosure] button')

      first.click()
      await tick()

      const disclosure = first.getAttribute('aria-expanded') +
        ' / panel hidden=' + document.getElementById('answer-1').hidden

      const trigger = document.querySelector('[data-ms-menu-trigger]')

      trigger.click()
      await tick()

      const menu = trigger.getAttribute('aria-expanded') +
        ' / panel hidden=' + document.querySelector('[data-ms-menu-panel]').hidden +
        ' / focus ' + document.activeElement.tagName

      const toggle = document.querySelector('[data-ms-color-mode-toggle]')
      const before = document.documentElement.dataset.colorMode

      toggle.click()
      await tick()

      let stored = 'unavailable'
      try { stored = String(localStorage.getItem('ms-color-mode')) } catch (error) { stored = 'blocked' }

      return {
        disclosure,
        menu,
        mode: before + ' -> ' + document.documentElement.dataset.colorMode +
          ' / aria-pressed ' + toggle.getAttribute('aria-pressed') + ' / stored ' + stored,
        errors: window.__errors,
      }
    })()`)

    const label = reduced ? 'reduced motion' : 'default'

    say(`disclosure (${label})`, result.disclosure)
    say(`menu (${label})`, result.menu)
    say(`theme toggle (${label})`, result.mode)
    say(`errors (${label})`, JSON.stringify(result.errors))
  }
}

page.close()
await chrome.close()
console.log(report.join('\n'))
