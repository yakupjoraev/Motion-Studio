#!/usr/bin/env node
/**
 * `docs/assets/architecture{,-dark}.svg` — the README's copy of the dependency graph.
 *
 *   pnpm generate:diagram
 *
 * Lifted from the running docs page rather than drawn again here. The picture is
 * `apps/web/src/components/docs/architecture-diagram.tsx`, and a second hand-maintained copy of
 * fifteen boxes and fifteen edges would be wrong within a month — the one thing a generated asset is
 * for is that it cannot drift.
 *
 * **Two files, with the colours resolved into the attributes.** The page paints through
 * `--ms-color-*` variables, which resolve to nothing in a file opened on its own, and GitHub strips
 * `<style>` out of an SVG before serving it — so a single file with a `prefers-color-scheme` block
 * would render as an unpainted skeleton in the one place this asset exists for. The README pairs
 * them in a `<picture>`, which is GitHub's own supported way to ship a themed image.
 *
 * Colours are converted to `#rrggbb` on the way out: the tokens are `oklch()`, and a canvas is the
 * cheapest correct converter — the browser doing the rendering is the one doing the maths.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { playwright } from './demos/record.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'docs', 'assets')

const PORT = process.env['PORT'] ?? '3000'
const ORIGIN = `http://localhost:${PORT}`

/** Everything the diagram paints with, plus the surface it sits on. */
const VARIABLES = [
  '--ms-color-surface-1',
  '--ms-color-surface-2',
  '--ms-color-accent',
  '--ms-color-accent-muted',
  '--ms-color-border',
  '--ms-color-border-subtle',
  '--ms-color-border-strong',
  '--ms-color-foreground',
  '--ms-color-foreground-muted',
  '--ms-font-mono',
]

/** The values as the page has them now, with every colour normalised to hex by the browser. */
const readPalette = (page) =>
  page.evaluate((names) => {
    const styles = getComputedStyle(document.documentElement)
    const context = document.createElement('canvas').getContext('2d')
    const values = {}

    for (const name of names) {
      const value = styles.getPropertyValue(name).trim()

      if (name.includes('font')) {
        values[name] = value
        continue
      }

      /*
       * Painted and read back rather than taken off `fillStyle`, which keeps `oklch()` as written.
       * One pixel through the canvas is the browser's own conversion to sRGB — which is what an SVG
       * viewer twelve years old also has to understand.
       */
      context.fillStyle = '#000000'
      context.fillStyle = value
      context.fillRect(0, 0, 1, 1)

      const [red, green, blue] = context.getImageData(0, 0, 1, 1).data

      values[name] =
        `#${[red, green, blue].map((part) => part.toString(16).padStart(2, '0')).join('')}`
    }

    return values
  }, VARIABLES)

/**
 * The light palette, which the public routes never display: they are pinned dark (ADR-318), and
 * `ThemeBoot` puts `data-color-mode` back within about 200 ms if it is changed by hand. A stored
 * preference is the one input the boot script honours (ADR-322), so the page arrives light instead.
 */
const openLight = async (page, origin) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('ms-color-mode', 'light')
  })
  await page.goto(`${origin}/docs/architecture`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(
    () => document.documentElement.getAttribute('data-color-mode') === 'light',
    undefined,
    { timeout: 15_000 },
  )
}

/** Every `var(--x)` replaced by the palette's value for it, so the file needs no stylesheet. */
const resolveVariables = (markup, palette) =>
  markup.replace(/var\((--[a-z0-9-]+)\)/g, (whole, name) => palette[name] ?? whole)

const openingTag = (tag, palette, size) => {
  const viewBox = /viewBox="([^"]+)"/.exec(tag)?.[1] ?? `0 0 ${size.width} ${size.height}`

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" viewBox="${viewBox}" role="img" aria-label="Motion Studio dependency graph"><title>Motion Studio dependency graph</title><rect width="100%" height="100%" fill="${palette['--ms-color-surface-1']}"/>`
}

const svgOf = (markup, palette, size) =>
  `${resolveVariables(markup, palette).replace(/^<svg[^>]*>/, (tag) =>
    openingTag(tag, palette, size),
  )}\n`

const { chromium } = playwright(ROOT)

const browser = await chromium.launch({ channel: 'chrome' })

try {
  const dark = await browser.newPage({ viewport: { width: 1280, height: 900 } })

  await dark.goto(`${ORIGIN}/docs/architecture`, { waitUntil: 'domcontentloaded' })

  const svg = dark.locator('[aria-label="Dependency graph"] svg')

  await svg.waitFor({ timeout: 30_000 })

  const size = await svg.evaluate((node) => ({
    width: Number(node.getAttribute('width')),
    height: Number(node.getAttribute('height')),
  }))

  /*
   * `aria-hidden` and `role="presentation"` are right inside the docs page, where a list beside the
   * picture carries the same information. On its own the file is the only thing there, so it gets a
   * title and a label instead — which is what a reader hears for an `<img>` of it.
   */
  const markup = (await svg.evaluate((node) => node.outerHTML)).replace(
    /\s(aria-hidden|role|class|style)="[^"]*"/g,
    '',
  )
  const darkPalette = await readPalette(dark)

  const light = await browser.newPage({ viewport: { width: 1280, height: 900 } })

  await openLight(light, ORIGIN)

  const lightPalette = await readPalette(light)

  await mkdir(OUT_DIR, { recursive: true })
  await writeFile(join(OUT_DIR, 'architecture.svg'), svgOf(markup, lightPalette, size), 'utf8')
  await writeFile(join(OUT_DIR, 'architecture-dark.svg'), svgOf(markup, darkPalette, size), 'utf8')

  console.log(
    `${relative(ROOT, OUT_DIR)}: architecture.svg + architecture-dark.svg — ${size.width} × ${size.height}`,
  )
} finally {
  await browser.close()
}
