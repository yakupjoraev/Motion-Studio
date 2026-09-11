/**
 * Builds the stylesheet the Tailwind elements in the catalogue need.
 *
 * 433 of the 3 802 elements have no `<style>` block: their styling is Tailwind class names, and a
 * shadow root sees none of the page's own CSS — which is the point of using one. Nor would the app's
 * own Tailwind build help, because it generates the classes it finds in **source files**, and these
 * live in JSON data it never scans.
 *
 * So the catalogue gets a stylesheet of its own, generated from the data by the same compiler the app
 * uses, with the stock Tailwind theme rather than this project's tokens: the elements were written
 * against stock Tailwind, and dressing them in our palette would show something their authors never
 * wrote. It is served as a static file so one download covers every card on the page.
 *
 * Usage: pnpm --filter web exec tsx scripts/build-uiverse-tailwind.ts
 *
 * It lives in the web app rather than in the repository's own `scripts/` because that is where
 * Tailwind is installed: a script at the root cannot resolve the compiler, and installing a second
 * copy there to run one script would be worse than putting the script beside the compiler.
 */
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

import tailwind from '@tailwindcss/postcss'
import postcss from 'postcss'

/** The script's own location, so the working directory it is run from does not matter. */
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..')

if (!existsSync(join(ROOT, 'pnpm-workspace.yaml'))) {
  throw new Error(`${ROOT} is not the repository root`)
}

const DATA = join(ROOT, 'packages', 'uiverse', 'data')
const OUT = join(ROOT, 'apps', 'web', 'public', 'uiverse-tailwind.css')

/*
 * `source(none)` turns off the automatic scan — without it Tailwind walks the repository from the CSS
 * file's directory and takes minutes to find classes this stylesheet must not contain. The one
 * `@source` is the catalogue, and `preflight` stays on: inside a shadow root a reset is isolation
 * rather than a global, and these elements were written expecting one.
 */
const input = `@import 'tailwindcss' source(none);\n@source '${DATA.replaceAll('\\', '/')}';\n`

const result = await postcss([tailwind()]).process(input, { from: undefined, to: OUT })

writeFileSync(OUT, result.css, 'utf8')

const kib = (statSync(OUT).size / 1024).toFixed(1)
const elements = JSON.parse(readFileSync(join(DATA, 'index.json'), 'utf8')) as {
  categories: { tailwind: number }[]
}
const tailwindElements = elements.categories.reduce((sum, entry) => sum + entry.tailwind, 0)

console.log(`${OUT}\n${kib} KiB for ${tailwindElements} Tailwind elements`)
