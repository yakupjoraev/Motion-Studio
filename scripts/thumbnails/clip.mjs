import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'

const require = createRequire(import.meta.url)
const run = promisify(execFile)

/**
 * The hover clip of COMPONENT_LIBRARY.md § Thumbnails — ADR-182.
 *
 * **The clip is byte-identical across runs**, which is the property prompt 26 could not meet and the
 * reason it was carried out of M4. Three things buy it, and each was measured before it was kept:
 *
 *   1. Every animation is **paused and driven by hand**. Virtual time was tried first and is not
 *      enough: a CSS animation's phase is measured from the moment it started, and that moment depends
 *      on how much of the budget the load consumed, so two runs land on different phases.
 *   2. A frame is captured only after `animation.ready` and two `requestAnimationFrame`s — the first
 *      commits the new phase, the second is the one that is painted. Without it one frame in six came
 *      back from the previous phase.
 *   3. libvpx-vp9 with one thread and no row threading, muxed `bitexact`, and then the container's
 *      `TrackUID` overwritten with a digest of the block and mode: ffmpeg fills it with 16 random
 *      bytes, which was the only thing left that differed between two runs.
 */
export const CLIP = {
  /** PERFORMANCE.md § Images: WebM (VP9). Two seconds at 20 fps is 40 frames. */
  frames: 40,
  fps: 20,
  stepMs: 50,
  crf: 36,
}

const ffmpegPath = () => require('ffmpeg-static')

/**
 * The two places the random track id lands: `TrackUID` (`0x73C5`) in the track entry and
 * `TagTrackUID` (`0x63C5`) in the tags, both with an 8-byte payload. Measured — they are the only
 * bytes that differ between two runs of the same frames.
 */
const UID_TAGS = [Buffer.from([0x73, 0xc5, 0x88]), Buffer.from([0x63, 0xc5, 0x88])]
const CLUSTER = Buffer.from([0x1f, 0x43, 0xb6, 0x75])

/**
 * Replaces both of them with a digest of the clip's identity, so the same block in the same mode gets
 * the same id every time. Bounded to the bytes before the first cluster, so a three-byte sequence
 * turning up inside compressed video cannot be hit.
 */
export function pinTrackUid(webm, identity) {
  const clusterAt = webm.indexOf(CLUSTER)
  const header = clusterAt === -1 ? webm.length : clusterAt
  const uid = createHash('sha256').update(identity).digest().subarray(0, 8)
  const out = Buffer.from(webm)

  for (const tag of UID_TAGS) {
    let at = out.indexOf(tag)

    while (at !== -1 && at + tag.length + uid.length <= header) {
      uid.copy(out, at + tag.length)
      at = out.indexOf(tag, at + tag.length + uid.length)
    }
  }

  return out
}

/** Whether the block animates at all. A still block gets no clip: 40 identical frames say nothing. */
export async function hasRunningAnimation(page) {
  const count = await page.evaluate(
    'document.getAnimations().filter((animation) => animation.playState === "running").length',
  )

  return count > 0
}

/** Pauses every animation and puts them all at phase zero, ready to be stepped. */
export const freezeAnimations = (page) =>
  page.evaluate(`(async () => {
    for (const animation of document.getAnimations()) {
      animation.pause()
      animation.currentTime = 0
    }

    await Promise.all(document.getAnimations().map((animation) => animation.ready))

    return document.getAnimations().length
  })()`)

/** Moves every animation to one phase and waits for the frame that paints it. */
const seek = (page, atMs) =>
  page.evaluate(`(async () => {
    for (const animation of document.getAnimations()) {
      animation.currentTime = ${atMs}
    }

    await Promise.all(document.getAnimations().map((animation) => animation.ready))
    await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)))

    return true
  })()`)

/**
 * Captures `CLIP.frames` PNGs at fixed phases and encodes them as a WebM. The page is left with its
 * animations paused, which the caller does not care about — it navigates for the next block.
 */
export async function captureClip(page, { blockId, mode, stage, width }) {
  await freezeAnimations(page)

  const directory = await mkdtemp(join(tmpdir(), 'ms-clip-'))

  try {
    for (let index = 0; index < CLIP.frames; index += 1) {
      await seek(page, index * CLIP.stepMs)

      const { data } = await page.call('Page.captureScreenshot', {
        format: 'png',
        captureBeyondViewport: false,
        clip: { x: 0, y: 0, width: stage.width, height: stage.height, scale: width / stage.width },
      })

      await writeFile(
        join(directory, `frame-${String(index).padStart(3, '0')}.png`),
        Buffer.from(data, 'base64'),
      )
    }

    const output = join(directory, 'clip.webm')

    await run(ffmpegPath(), [
      '-hide_banner',
      '-loglevel',
      'error',
      '-y',
      // No muxing app, no writing app, no dates: the container carries nothing about this run.
      '-fflags',
      '+bitexact',
      '-flags:v',
      '+bitexact',
      '-framerate',
      String(CLIP.fps),
      '-i',
      join(directory, 'frame-%03d.png'),
      '-c:v',
      'libvpx-vp9',
      '-pix_fmt',
      'yuv420p',
      '-b:v',
      '0',
      '-crf',
      String(CLIP.crf),
      // One thread, no row threading: libvpx splits work differently run to run otherwise.
      '-threads',
      '1',
      '-row-mt',
      '0',
      '-cpu-used',
      '2',
      '-deadline',
      'good',
      '-an',
      output,
    ])

    return pinTrackUid(await readFile(output), `${blockId}-${mode}`)
  } finally {
    await rm(directory, { recursive: true, force: true })
  }
}
