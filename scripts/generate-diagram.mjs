#!/usr/bin/env node
/**
 * `docs/assets/architecture.svg` — the README's copy of the dependency graph.
 *
 *   pnpm generate:diagram
 *
 * Lifted from the running docs page rather than drawn again here. The picture is
 * `apps/web/src/components/docs/architecture-diagram.tsx`, and a second hand-maintained copy of
 * fifteen boxes and fifteen edges would be wrong within a month — the one thing a generated asset is
 * for is that it cannot drift.
 *
 * The page's SVG paints through `--ms-color-*` variables, which resolve to nothing in a file opened
 * on its own. So both themes are read out of the live document and written into the file as a
 * `<style>` block: light on `:root`, dark under `prefers-color-scheme`. GitHub renders a README's SVG
 * in an `<img>`, where a media query inside the file still applies — so the diagram follows the
 * reader's own system theme rather than being legible in one of them.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { playwright } from './demos/record.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'docs', 'assets', 'architecture.svg')

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

/**
 * The values as the page has them now — the public routes are pinned dark (ADR-318), so this is the
 * dark palette without touching anything.
 */
const readCurrent = (page) =>
  page.evaluate((names) => {
    const styles = getComputedStyle(document.documentElement)
    const values = {}

    for (const name of names) {
      values[name] = styles.getPropertyValue(name).trim()
    }

    return values
  }, VARIABLES)

/**
 * The light palette, which this page never displays on its own.
 *
 * Through the stored preference rather than by setting the attribute: the public routes are pinned
 * dark (ADR-318) and `ThemeBoot` puts `data-color-mode` back within about 200 ms, so every version of
 * this that flipped the attribute read the dark palette back. A stored mode is the one input the boot
 * script honours (ADR-322), so the page arrives light and stays light.
 */
const readLight = async (page, origin) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('ms-color-mode', 'light')
  })
  await page.goto(`${origin}/docs/architecture`, { waitUntil: 'domcontentloaded' })
  await page.waitForFunction(
    () => document.documentElement.getAttribute('data-color-mode') === 'light',
    undefined,
    { timeout: 15_000 },
  )

  return readCurrent(page)
}

const declarations = (values) =>
  Object.entries(values)
    .map(([name, value]) => `    ${name}: ${value};`)
    .join('\n')

const { chromium } = playwright(ROOT)

const browser = await chromium.launch({ channel: 'chrome' })
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })

try {
  await page.goto(`${ORIGIN}/docs/architecture`, { waitUntil: 'domcontentloaded' })

  const svg = page.locator('[aria-label="Dependency graph"] svg')

  await svg.waitFor({ timeout: 30_000 })

  const dark = await readCurrent(page)
  const light = await readLight(page, ORIGIN)
  const markup = await svg.evaluate((node) => node.outerHTML)
  const size = await svg.evaluate((node) => ({
    width: Number(node.getAttribute('width')),
    height: Number(node.getAttribute('height')),
  }))

  /*
   * `aria-hidden` and `role="presentation"` are right inside the docs page, where a list beside the
   * picture carries the same information. On its own the file is the only thing there, so it gets a
   * title instead — which is what a screen reader announces for an `<img>` of it.
   */
  const styled = markup
    // The page's own attributes go: `class` and `style` mean nothing in a file, and the two that are
    // rewritten below would otherwise appear twice.
    .replace(/^<svg[^>]*>/, (tag) => {
      const viewBox = /viewBox="([^"]+)"/.exec(tag)?.[1] ?? `0 0 ${size.width} ${size.height}`

      return (
        `<svg xmlns="http://www.w3.org/2000/svg" width="${size.width}" height="${size.height}" ` +
        `viewBox="${viewBox}" role="img" aria-label="Motion Studio dependency graph">`
      )
    })
    .replace(
      />/,
      `>
  <title>Motion Studio dependency graph</title>
  <style>
  :root {
${declarations(light)}
    --ms-diagram-surface: ${light['--ms-color-surface-1']};
  }
  @media (prefers-color-scheme: dark) {
    :root {
${declarations(dark)}
      --ms-diagram-surface: ${dark['--ms-color-surface-1']};
    }
  }
  </style>
  <rect width="100%" height="100%" fill="var(--ms-diagram-surface)" />`,
    )

  await mkdir(dirname(OUT), { recursive: true })
  await writeFile(OUT, `${styled}\n`, 'utf8')

  console.log(`${relative(ROOT, OUT)} — ${size.width} × ${size.height}, both colour modes inline`)
} finally {
  await browser.close()
}
