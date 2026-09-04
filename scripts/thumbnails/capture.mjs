/**
 * One block, one colour mode, one still — and the animated clip beside it when the block moves.
 *
 * Everything about *how* a thumbnail is taken lives here: the stage it is rendered at, the media
 * features that make the still a still, the wait that proves the block is on screen, and the
 * placeholder derived from the still itself. `generate-thumbnails.mjs` owns the run around it.
 */
import { CLIP, captureClip, hasRunningAnimation } from './clip.mjs'

export { CLIP }

/** PERFORMANCE.md § Images: WebP at exactly 320 × 200, quality 82, with a blur placeholder. */
export const THUMBNAIL = { width: 320, height: 200, quality: 82 }
/** Rendered four times the final size, so the downscale is what removes the aliasing. */
export const STAGE = { width: THUMBNAIL.width * 4, height: THUMBNAIL.height * 4 }
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

export const MODES = ['dark', 'light']
export const PORT = 61_231
export const DEBUG_PORT = 61_232

export const storyUrl = (blockId, mode) =>
  `http://127.0.0.1:${PORT}/iframe.html?id=thumbnail-block--preview` +
  `&globals=theme:${mode === 'dark' ? 'studio-dark' : 'studio-light'};colorMode:${mode}` +
  `&args=blockId:${encodeURIComponent(blockId)}`

/**
 * The clip runs at **full motion** — it exists to show what the block does — while the still is taken
 * under a reduced-motion preference, which is what makes it a still at all.
 */
export async function captureBlockClip(page, blockId, mode) {
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

export async function capture(page, blockId, mode) {
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
