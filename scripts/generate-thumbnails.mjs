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
import {
  CLIP,
  DEBUG_PORT,
  MODES,
  PORT,
  STAGE,
  THUMBNAIL,
  capture,
  captureBlockClip,
  storyUrl,
} from './thumbnails/capture.mjs'
import { serveStatic } from './thumbnails/serve.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(HERE, '..')
const STORYBOOK = join(ROOT, 'apps', 'storybook', 'storybook-static')
const OUT_DIR = join(ROOT, 'apps', 'web', 'public', 'thumbnails')
const MANIFEST = join(OUT_DIR, 'thumbnails.json')

const argv = process.argv.slice(2)
const only = argv.includes('--block') ? argv[argv.indexOf('--block') + 1] : null
const verify = argv.includes('--verify')

const fail = (message) => {
  console.error(`generate-thumbnails: ${message}`)
  process.exit(1)
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
