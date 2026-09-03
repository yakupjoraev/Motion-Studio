import { execFile } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, readdir, rename, rm, stat } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

import { CURSOR_SCRIPT } from './cursor.mjs'

/**
 * Recording and encoding — `prompts/59` § `generate-demos.mjs`.
 *
 * `playwright-core` is resolved from `e2e/`, which is the package that declares it. Requiring it
 * from here would mean a second copy of a 60 MB dependency in the root manifest for one script.
 */
const require = createRequire(import.meta.url)

export const VIEWPORT = { width: 1440, height: 900 }

/**
 * GIF settings, tried in order until one lands under the size cap — `prompts/59` asks for 1200 px
 * and under 3 MB, and on this product's own demos those two fight.
 *
 * Measured on `grab-effect.webm`, 10.2 s of a full-screen aurora, which is the worst case the
 * catalogue has: a moving gradient differs in every pixel of every frame, so inter-frame compression
 * has nothing to remove. 1200 px at 13 fps with dithering is **8 MB**; the same clip at 1000 px,
 * 10 fps and 64 colours without dithering is 3 MB. Dithering is what costs the most — it turns a
 * smooth gradient into noise, and noise is what a GIF cannot pack — so it is the first thing dropped.
 *
 * The ladder therefore starts at the prompt's number and walks down: width before frame rate,
 * because a demo that stutters reads as a broken product and a slightly smaller one does not.
 */
const ENCODINGS = [
  { fps: 13, colors: 200, width: 1200, dither: 'bayer:bayer_scale=4' },
  { fps: 12, colors: 160, width: 1200, dither: 'none' },
  { fps: 12, colors: 128, width: 1100, dither: 'none' },
  { fps: 11, colors: 96, width: 1000, dither: 'none' },
  { fps: 10, colors: 64, width: 1000, dither: 'none' },
  { fps: 10, colors: 64, width: 900, dither: 'none' },
  { fps: 9, colors: 48, width: 900, dither: 'none' },
  { fps: 8, colors: 48, width: 800, dither: 'none' },
  { fps: 8, colors: 64, width: 720, dither: 'none' },
]

export const MAX_GIF_BYTES = 3 * 1024 * 1024

const exec = promisify(execFile)

export function playwright(root) {
  return createRequire(join(root, 'e2e', 'package.json'))('playwright-core')
}

/**
 * One context per demo, thrown away with its video: Playwright writes the file when the context
 * closes, and a shared context would put four flows in one recording.
 */
export async function record(browser, scenario, { origin, videoDir }) {
  const context = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 1,
    recordVideo: { dir: videoDir, size: VIEWPORT },
    // The demos are the product working, not the product handling a slow connection.
    reducedMotion: 'no-preference',
  })

  await context.addInitScript(CURSOR_SCRIPT)

  const page = await context.newPage()

  try {
    await scenario(page, origin)
  } finally {
    await page.close()
    await context.close()
  }

  const written = (await readdir(videoDir)).filter((name) => name.endsWith('.webm'))
  const newest = written.at(-1)

  if (newest === undefined) {
    throw new Error('Playwright wrote no video for this demo')
  }

  return join(videoDir, newest)
}

const ffmpeg = () => {
  const binary = require('ffmpeg-static')

  if (typeof binary !== 'string' || !existsSync(binary)) {
    throw new Error('ffmpeg-static did not resolve to a binary; run `pnpm install` again')
  }

  return binary
}

/** Two passes over one input: a palette built from the whole clip, then applied to it. */
const gifFilter = ({ fps, colors, width, dither }) =>
  [
    `fps=${fps}`,
    `scale=${width}:-1:flags=lanczos`,
    'split[a][b]',
    `[a]palettegen=max_colors=${colors}:stats_mode=diff[p]`,
    `[b][p]paletteuse=dither=${dither}:diff_mode=rectangle`,
  ].join(',')

export async function toGif(webm, gif) {
  for (const encoding of ENCODINGS) {
    await exec(ffmpeg(), [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      '-i',
      webm,
      '-filter_complex',
      gifFilter(encoding),
      '-loop',
      '0',
      gif,
    ])

    const { size } = await stat(gif)

    if (size <= MAX_GIF_BYTES) {
      return { ...encoding, bytes: size }
    }
  }

  return { ...ENCODINGS.at(-1), bytes: (await stat(gif)).size }
}

/** Seconds, off the container rather than off the wall clock the scenario took. */
export async function durationOf(webm) {
  const { stdout } = await exec(ffmpeg(), ['-hide_banner', '-i', webm], { encoding: 'utf8' }).catch(
    (error) => ({ stdout: `${error.stdout ?? ''}${error.stderr ?? ''}` }),
  )
  const found = /Duration: (\d+):(\d+):(\d+\.\d+)/.exec(stdout)

  if (found === null) {
    return null
  }

  return Number(found[1]) * 3600 + Number(found[2]) * 60 + Number(found[3])
}

export async function scratchDir(name) {
  return mkdtemp(join(tmpdir(), `ms-demo-${name}-`))
}

export async function publish(webm, outDir, name) {
  await mkdir(outDir, { recursive: true })

  const target = join(outDir, `${name}.webm`)

  await rm(target, { force: true })
  await rename(webm, target)

  return target
}
