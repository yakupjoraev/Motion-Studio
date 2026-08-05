/**
 * Bitcoin's base58 alphabet: the 62 alphanumerics minus `0`, `O`, `I`, and `l`. Ids appear in export
 * filenames and in the layers panel, where those four are the pairs a reader confuses.
 */
const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'

const ID_LENGTH = 22

/**
 * 232 is 4 × 58, so bytes below it map onto the alphabet with no bias. Keeping 232–255 would make the
 * first 24 characters of the alphabet ~1.3× more likely than the other 34. Rejecting them costs
 * roughly 9 % more random bytes and makes the distribution exactly uniform.
 */
const REJECT_AT = 232

/**
 * `createId('node')` → `node_` plus 22 base58 characters, per `FILE_FORMAT.md` § Ids. Ids are opaque:
 * nothing derives meaning from them and nothing sorts by them, which is why an unordered random id is
 * correct here rather than a timestamp-prefixed one.
 *
 * Tests inject `counterIds()` instead of calling this, so no tested code path depends on
 * `crypto.getRandomValues` — `TESTING.md` § Determinism.
 */
export function createId(prefix: string): string {
  const characters: string[] = []

  while (characters.length < ID_LENGTH) {
    const bytes = new Uint8Array(ID_LENGTH)
    crypto.getRandomValues(bytes)

    for (const byte of bytes) {
      if (byte < REJECT_AT && characters.length < ID_LENGTH) {
        characters.push(ALPHABET.charAt(byte % ALPHABET.length))
      }
    }
  }

  return `${prefix}_${characters.join('')}`
}

/**
 * The deterministic counterpart, injected in tests so ids are reproducible —
 * `TESTING.md` § Determinism. `counterIds()` yields `node_1`, `node_2`, and so on.
 *
 * The counter in the closure is the one piece of mutable state in this package, and it is per-call:
 * two generators never share a sequence, so one test cannot shift another's ids.
 */
export function counterIds(prefix = 'node'): () => string {
  let count = 0

  return () => {
    count += 1
    return `${prefix}_${count}`
  }
}
