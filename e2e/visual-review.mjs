/**
 * Shoots every block into a scratch directory and lays the results out as contact sheets, so the
 * whole registry can be looked at side by side — `prompts/57`: "124 block screenshots in one place is
 * the first time anyone has seen the whole registry side by side."
 *
 * Not a test and not a baseline generator: the images live outside the repository and the sheets are
 * for reading. Baselines come from CI — `scripts/update-baselines.mjs` says why.
 *
 *   node visual-review.mjs <out-dir> [--mode light|dark] [--sheets-only]
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'

import { chromium } from 'playwright-core'

const OUT = process.argv[2]
const only = process.argv.includes('--mode')
  ? process.argv[process.argv.indexOf('--mode') + 1]
  : null
const sheetsOnly = process.argv.includes('--sheets-only')
const ORIGIN = 'http://127.0.0.1:6007'
const PER_SHEET = 8

const blocks = () => {
  const found = []
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) {
        walk(path)
      } else if (entry.name.endsWith('.definition.ts')) {
        const source = readFileSync(path, 'utf8')
        if (!source.includes('previewProps')) continue
        const id = /\bid:\s*blockId\('([a-z0-9-]+)'\)/.exec(source)?.[1]
        if (id) found.push(id)
      }
    }
  }
  walk(join('..', 'packages', 'blocks', 'src'))
  return found.sort()
}

const shoot = async (page, blockId, mode) => {
  const theme = mode === 'dark' ? 'studio-dark' : 'studio-light'
  await page.emulateMedia({ colorScheme: mode, reducedMotion: 'reduce' })
  await page.goto(
    `${ORIGIN}/iframe.html?id=thumbnail-block--preview&globals=theme:${theme};colorMode:${mode}&args=blockId:${blockId}`,
  )
  await page
    .locator(`[data-thumbnail-ready="${blockId}"] > div > *`)
    .first()
    .waitFor({ state: 'attached', timeout: 30_000 })
  await page.evaluate(() => document.fonts.ready.then(() => true))
  await page.evaluate(
    () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null)))),
  )
  await page.screenshot({ path: join(OUT, `${blockId}-${mode}.png`), animations: 'disabled' })
}

/** One sheet per eight blocks: a grid of labelled stills, itself screenshotted so it can be read. */
const sheet = async (page, entries, index, mode) => {
  const cells = entries
    .map(
      ([id, file]) =>
        `<figure><img src="file:///${file.replace(/\\/g, '/')}"><figcaption>${id}</figcaption></figure>`,
    )
    .join('')

  const html = `<!doctype html><meta charset="utf-8"><style>
    body{margin:0;background:#111;color:#eee;font:12px/1.3 system-ui;display:grid;
         grid-template-columns:repeat(2,1fr);gap:8px;padding:8px}
    figure{margin:0}
    img{width:100%;display:block;border:1px solid #444}
    figcaption{padding:2px 4px;font-weight:600}
  </style>${cells}`

  const file = join(OUT, `sheet-${mode}-${index}.html`)
  writeFileSync(file, html, 'utf8')

  await page.setViewportSize({ width: 1400, height: 1800 })
  await page.goto(`file:///${file.replace(/\\/g, '/')}`)
  await page.waitForTimeout(400)
  await page.screenshot({ path: join(OUT, `sheet-${mode}-${index}.png`), fullPage: true })
}

if (!existsSync(OUT)) mkdirSync(OUT, { recursive: true })

const ids = blocks()
const modes = only ? [only] : ['light', 'dark']
const browser = await chromium.launch({ channel: 'chrome' })

for (const mode of modes) {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
  })

  if (!sheetsOnly) {
    for (const id of ids) {
      await shoot(page, id, mode)
      process.stdout.write(`${id}-${mode} `)
    }
  }

  const files = ids.map((id) => [id, resolve(OUT, `${id}-${mode}.png`)])

  for (let index = 0; index * PER_SHEET < files.length; index += 1) {
    await sheet(page, files.slice(index * PER_SHEET, (index + 1) * PER_SHEET), index + 1, mode)
  }

  await page.close()
  console.log(`\n${mode}: ${ids.length} shots, ${Math.ceil(ids.length / PER_SHEET)} sheets`)
}

await browser.close()
