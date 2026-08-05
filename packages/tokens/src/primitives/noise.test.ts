import { describe, expect, it } from 'vitest'

import { NOISE, NOISE_TEXTURE } from './noise'

describe('NOISE', () => {
  it('ascends from none', () => {
    const values = Object.values(NOISE)

    expect(values).toEqual([...values].sort((a, b) => a - b))
    expect(NOISE.none).toBe(0)
  })

  it('keeps every amount an opacity, so it can drive one overlay', () => {
    for (const value of Object.values(NOISE)) {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThanOrEqual(1)
    }
  })
})

describe('NOISE_TEXTURE', () => {
  it('stays under 1 kB, since it ships inline rather than over the network', () => {
    expect(NOISE_TEXTURE.length).toBeLessThan(1024)
  })

  it('decodes to the documented feTurbulence filter', () => {
    const svg = Buffer.from(NOISE_TEXTURE.split(',')[1] ?? '', 'base64').toString('utf8')

    expect(svg).toBe(
      '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120">' +
        '<filter id="n"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="3" ' +
        'stitchTiles="stitch"/></filter>' +
        '<rect width="120" height="120" filter="url(#n)"/></svg>',
    )
  })

  it('is fractalNoise rather than turbulence, which would produce dark veins', () => {
    const svg = Buffer.from(NOISE_TEXTURE.split(',')[1] ?? '', 'base64').toString('utf8')

    expect(svg).toContain('type="fractalNoise"')
  })

  it('stitches its tiles, or every tile edge is a visible seam once the browser repeats it', () => {
    const svg = Buffer.from(NOISE_TEXTURE.split(',')[1] ?? '', 'base64').toString('utf8')

    expect(svg).toContain('stitchTiles="stitch"')
  })
})
