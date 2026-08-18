#!/usr/bin/env node
/**
 * Block thumbnails — COMPONENT_LIBRARY.md § Thumbnails.
 *
 *   pnpm generate:thumbnails
 *   pnpm generate:thumbnails --block hero-aurora
 *
 * Renders every block's `previewProps` through the Storybook build, screenshots it in both colour
 * modes, and writes a 320 × 200 WebP plus a blur placeholder per mode, with a manifest beside them.
 *
 * **Determinism is a requirement, not a nicety** — the output is committed, so a generator that
 * produced different bytes from the same input would churn the repository on every run. Four things
 * buy it, and `--verify` proves it by running twice and comparing:
 *
 *   1. reduced motion is emulated, which stops the aurora drift and the terminal caret — the two
 *      things in the catalogue that would otherwise be screenshotted at an arbitrary phase;
 *   2. the device scale factor is pinned and font hinting is off, so glyph rasterisation does not
 *      follow the machine's display;
 *   3. Chrome encodes the WebP itself at a fixed quality, so there is no second encoder to disagree;
 *   4. the manifest is written with sorted keys and a trailing newline.
 *
 * ADR-125 records why this drives Chrome directly rather than through Playwright. ADR-182 records how
 * the animated hover clip — carried out of M4 because a recording cannot be byte-identical — is made
 * byte-identical after all: paused animations stepped by hand, then VP9 muxed `bitexact`.
 */
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { connect, launchChrome } from './thumbnails/browser.mjs'
import { CLIP, captureClip, hasRunningAnimation } from './thumbnails/clip.mjs'
import { serveStatic } from './thumbnails/serve.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const STORYBOOK = join(ROOT, 'apps', 'storybook', 'storybook-static')
const OUT_DIR = join(ROOT, 'apps', 'web', 'public', 'thumbnails')
const MANIFEST = join(OUT_DIR, 'thumbnails.json')

/** PERFORMANCE.md § Images: WebP at exactly 320 × 200, quality 82, with a blur placeholder. */
export const THUMBNAIL = { width: 320, height: 200, quality: 82 }
/** Rendered four times the final size, so the downscale is what removes the aliasing. */
const STAGE = { width: THUMBNAIL.width * 4, height: THUMBNAIL.height * 4 }
/**
 * 8 × 5, not the 4 × 3 the prompt suggests, and the reason is the determinism requirement rather than
 * taste: the frame is 1.6 : 1, so 4 × 3 asks Chrome to scale 1280 × 800 by 0.003125 into a box whose
 * height lands on 2.5 px. Measured, that rounding was one of two sources of non-determinism here —
 * every WebP was byte-identical across runs and the manifest was not, because the blur was resolved
 * differently. 8 × 5 divides the stage exactly. The second source, a re-rasterised `backdrop-filter`,
 * is what ADR-197 removed by deriving the placeholder from the still.
 */
const BLUR = { width: 8, height: 5 }

/**
 * The blur placeholder, produced from the **still** rather than from a second screenshot — ADR-197.
 *
 * A second `captureScreenshot` at scale 0.00625 asks Chrome to rasterise the page again, and a page
 * with a `backdrop-filter` on it does not rasterise identically twice: the dock's dark placeholder
 * alternated between two encodings across full runs while its 320 px still stayed byte-identical.
 * Downscaling the still cannot disagree with the still, which is what a placeholder is for.
 */
const downscale = async (page, thumbnail) =>
  await page.evaluate(`(async () => {
    const image = new Image()

    image.src = 'data:image/webp;base64,${thumbnail}'
    await image.decode()

    const canvas = document.createElement('canvas')

    canvas.width = ${BLUR.width}
    canvas.height = ${BLUR.height}

    const context = canvas.getContext('2d')

    context.imageSmoothingEnabled = true
    context.imageSmoothingQuality = 'high'
    context.drawImage(image, 0, 0, ${BLUR.width}, ${BLUR.height})

    return canvas.toDataURL('image/webp', ${THUMBNAIL.quality / 100}).split(',')[1]
  })()`)

const MODES = ['dark', 'light']
const PORT = 61_231
const DEBUG_PORT = 61_232

const argv = process.argv.slice(2)
const only = argv.includes('--block') ? argv[argv.indexOf('--block') + 1] : null
const verify = argv.includes('--verify')

const fail = (message) => {
  console.error(`generate-thumbnails: ${message}`)
  process.exit(1)
}

const storyUrl = (blockId, mode) =>
  `http://127.0.0.1:${PORT}/iframe.html?id=thumbnail-block--preview` +
  `&globals=theme:${mode === 'dark' ? 'studio-dark' : 'studio-light'};colorMode:${mode}` +
  `&args=blockId:${encodeURIComponent(blockId)}`

/**
 * The clip runs at **full motion** — it exists to show what the block does — while the still is taken
 * under a reduced-motion preference, which is what makes it a still at all.
 */
async function captureBlockClip(page, blockId, mode) {
  await page.call('Emulation.setEmulatedMedia', {
    features: [{ name: 'prefers-color-scheme', value: mode }],
  })
  await page.call('Page.navigate', { url: storyUrl(blockId, mode) })
  await page.waitFor(
    async () =>
      await page
        .evaluate(
          `document.readyState === 'complete' &&
           document.querySelector('[data-thumbnail-ready="${blockId}"] > div > *') !== null`,
        )
        .catch(() => false),
    20_000,
    `${blockId} (${mode}) to render for its clip`,
  )
  await page.evaluate('document.fonts.ready.then(() => true)')

  if (!(await hasRunningAnimation(page))) {
    return null
  }

  return await captureClip(page, { blockId, mode, stage: STAGE, width: THUMBNAIL.width })
}

async function capture(page, blockId, mode) {
  /*
   * The colour mode is emulated as a *media feature*, not only chosen in the story. The generated
   * token stylesheet bridges `--ms-color-*` into Tailwind's `--color-*` on `:root`, so a utility like
   * `bg-surface-0` resolves against the root — which follows `prefers-color-scheme` and not a scoped
   * `ThemeScope`. Without this every light thumbnail came back painted in the dark palette.
   */
  await page.call('Emulation.setEmulatedMedia', {
    features: [
      { name: 'prefers-reduced-motion', value: 'reduce' },
      { name: 'prefers-color-scheme', value: mode },
    ],
  })

  await page.call('Page.navigate', { url: storyUrl(blockId, mode) })

  // The block's own root, not the stage's: `code-block` and `video` are lazy, and waiting for the
  // wrapper would screenshot the Suspense hole rather than the block.
  await page.waitFor(
    async () =>
      await page
        .evaluate(
          `document.readyState === 'complete' &&
           document.querySelector('[data-thumbnail-ready="${blockId}"] > div > *') !== null`,
        )
        .catch(() => false),
    20_000,
    `${blockId} (${mode}) to render`,
  )

  // Fonts decide glyph shape; screenshotting before they resolve is the classic flaky thumbnail.
  await page.evaluate('document.fonts.ready.then(() => true)')

  const shot = async (width) => {
    const { data } = await page.call('Page.captureScreenshot', {
      format: 'webp',
      quality: THUMBNAIL.quality,
      captureBeyondViewport: false,
      clip: {
        x: 0,
        y: 0,
        width: STAGE.width,
        height: STAGE.height,
        scale: width / STAGE.width,
      },
    })

    return data
  }

  const thumbnail = await shot(THUMBNAIL.width)

  return {
    thumbnail: Buffer.from(thumbnail, 'base64'),
    blur: Buffer.from(await downscale(page, thumbnail), 'base64'),
  }
}

async function generate() {
  if (!existsSync(join(STORYBOOK, 'index.json'))) {
    fail(`no Storybook build at ${STORYBOOK}. Run \`pnpm build:storybook\` first.`)
  }

  const server = await serveStatic(STORYBOOK, PORT)
  const chrome = await launchChrome({ port: DEBUG_PORT })
  const page = await connect(chrome.webSocketDebuggerUrl)

  await page.call('Emulation.setDeviceMetricsOverride', {
    width: STAGE.width,
    height: STAGE.height,
    deviceScaleFactor: 1,
    mobile: false,
  })
  // The block list is the registry's, published by the thumbnail page — never a second list here.
  await page.call('Page.navigate', { url: storyUrl('hero-centered', 'dark') })
  await page.waitFor(
    async () => await page.evaluate('window.__MOTION_STUDIO_BLOCKS__ ?? null').catch(() => null),
    20_000,
    'the thumbnail page to publish the registry',
  )

  const blockIds = await page.evaluate('window.__MOTION_STUDIO_BLOCKS__')
  const targets = only === null ? blockIds : blockIds.filter((id) => id === only)

  if (targets.length === 0) {
    fail(only === null ? 'no blocks found in the Storybook index' : `no block called ${only}`)
  }

  await mkdir(OUT_DIR, { recursive: true })

  const manifest = existsSync(MANIFEST) ? JSON.parse(await readFile(MANIFEST, 'utf8')) : {}

  for (const blockId of targets.sort()) {
    manifest[blockId] = manifest[blockId] ?? {}

    const clips = {}

    for (const mode of MODES) {
      const { thumbnail, blur } = await capture(page, blockId, mode)
      const file = `${blockId}-${mode}.webp`

      await writeFile(join(OUT_DIR, file), thumbnail)

      manifest[blockId][mode] = {
        src: `/thumbnails/${file}`,
        width: THUMBNAIL.width,
        height: THUMBNAIL.height,
        blurDataUrl: `data:image/webp;base64,${blur.toString('base64')}`,
      }

      const clip = await captureBlockClip(page, blockId, mode)

      if (clip !== null) {
        const clipFile = `${blockId}-${mode}.webm`

        await writeFile(join(OUT_DIR, clipFile), clip)
        clips[mode] = `/thumbnails/${clipFile}`
      }
    }

    /*
     * A block that stopped animating loses its clip rather than keeping a stale one. `undefined`
     * rather than `delete`: `JSON.stringify` drops the key either way, and the sorted-keys pass below
     * carries it through.
     */
    manifest[blockId].clip = Object.keys(clips).length === MODES.length ? clips : undefined

    console.log(`  ${blockId}${Object.keys(clips).length === MODES.length ? ' + clip' : ''}`)
  }

  await writeFile(MANIFEST, `${JSON.stringify(sortKeys(manifest), null, 2)}\n`)

  await page.close()
  await chrome.close()
  await server.close()

  return targets
}

/** Sorted keys, so two runs that produce the same data produce the same file. */
const sortKeys = (value) =>
  Array.isArray(value)
    ? value.map(sortKeys)
    : value !== null && typeof value === 'object'
      ? Object.fromEntries(
          Object.keys(value)
            .sort()
            .map((key) => [key, sortKeys(value[key])]),
        )
      : value

/** Per file rather than one hash over all of them: a failing `--verify` has to name what churned. */
const digest = async () => {
  const files = (await readdir(OUT_DIR)).sort()
  const hashes = new Map()

  for (const file of files) {
    hashes.set(
      file,
      createHash('sha256')
        .update(await readFile(join(OUT_DIR, file)))
        .digest('hex'),
    )
  }

  return hashes
}

const changed = (first, second) => {
  const names = new Set([...first.keys(), ...second.keys()])

  return [...names].filter((name) => first.get(name) !== second.get(name)).sort()
}

console.log(`generate-thumbnails: writing to ${OUT_DIR}`)

const written = await generate()

if (verify) {
  const first = await digest()

  console.log('generate-thumbnails: second pass, to prove the output is deterministic')

  await generate()

  const second = await digest()
  const differences = changed(first, second)

  if (differences.length > 0) {
    for (const name of differences) {
      console.error(`  churned: ${name}`)
    }

    fail(`two runs produced different bytes in ${differences.length} file(s)`)
  }

  console.log(`generate-thumbnails: identical across two runs (${first.size} files)`)
}

console.log(
  `generate-thumbnails: ${written.length} block(s), ${MODES.length} modes each, ` +
    `clips at ${CLIP.frames} frames / ${CLIP.fps} fps`,
)

// A stale file for a block that no longer exists would pass `check:registry` unnoticed otherwise.
if (only === null) {
  const manifest = JSON.parse(await readFile(MANIFEST, 'utf8'))
  const expected = new Set([
    ...written.flatMap((id) => MODES.map((mode) => `${id}-${mode}.webp`)),
    ...written.flatMap((id) =>
      MODES.filter((mode) => manifest[id]?.clip?.[mode] !== undefined).map(
        (mode) => `${id}-${mode}.webm`,
      ),
    ),
  ])
  const stale = (await readdir(OUT_DIR)).filter(
    (file) => (file.endsWith('.webp') || file.endsWith('.webm')) && !expected.has(file),
  )

  for (const file of stale) {
    await rm(join(OUT_DIR, file))
    console.log(`  removed stale ${file}`)
  }
}
