import { DRAGGED_BLOCK } from './hero-stage'

/**
 * The catalogue's thumbnail for the block on the card, by path rather than through the manifest.
 *
 * `thumbnails.json` carries all seventy-two entries with a base64 blur placeholder each, and
 * importing it for one block put 14 kB of the other seventy-one in the landing's first load —
 * measured as the route going from 111 kB to 125 kB against a 120 kB budget (PERFORMANCE.md
 * § Public pages).
 *
 * The naming is the generator's (`scripts/generate-thumbnails.mjs`) and `check:registry` keeps a file
 * there for every block, so the path is derivable. `hero-thumbnail.test.ts` reads the directory and
 * fails if this one is not on disk, which is the part a path cannot promise on its own.
 */
export const HERO_THUMBNAIL = {
  src: `/thumbnails/${DRAGGED_BLOCK.id}-dark.webp`,
  width: 320,
  height: 200,
} as const
