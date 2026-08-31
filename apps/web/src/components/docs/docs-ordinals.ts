export interface Ordinals {
  readonly nextCode: () => number
  readonly nextTable: () => number
}

/**
 * Each scrollable region on a page needs its own accessible name, and "the third code sample" is the
 * only thing that distinguishes two fences of the same language. A counter walked in render order is
 * deterministic, which is what makes the anchors and the names stable between builds.
 */
export function createOrdinals(): Ordinals {
  let code = 0
  let table = 0

  return {
    nextCode: () => {
      code += 1

      return code
    },
    nextTable: () => {
      table += 1

      return table
    },
  }
}
