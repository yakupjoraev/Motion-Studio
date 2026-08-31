export interface DocFrontmatter {
  readonly group: string
  readonly order: number
  readonly summary: string
}

export interface SplitDocument {
  readonly frontmatter: DocFrontmatter | null
  readonly body: string
}

const KEYS = ['group', 'order', 'summary'] as const

const unquote = (value: string): string =>
  (value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))
    ? value.slice(1, -1)
    : value

/**
 * Three keys, one line each. A build-time invariant, so a malformed block throws rather than
 * degrading — a document that silently loses its place in the nav is harder to notice than a build
 * that stops.
 */
export function splitFrontmatter(raw: string, name: string): SplitDocument {
  if (!raw.startsWith('---\n')) {
    return { frontmatter: null, body: raw }
  }

  const end = raw.indexOf('\n---', 4)

  if (end === -1) {
    throw new Error(`${name}: the frontmatter block is not closed`)
  }

  const fields = new Map<string, string>()

  for (const line of raw.slice(4, end).split('\n')) {
    if (line.trim() === '') {
      continue
    }

    const separator = line.indexOf(':')

    if (separator === -1) {
      throw new Error(`${name}: frontmatter line is not "key: value" — ${line}`)
    }

    const key = line.slice(0, separator).trim()

    if (!KEYS.includes(key as (typeof KEYS)[number])) {
      throw new Error(`${name}: unknown frontmatter key "${key}"`)
    }

    fields.set(key, unquote(line.slice(separator + 1).trim()))
  }

  for (const key of KEYS) {
    if (!fields.has(key)) {
      throw new Error(`${name}: frontmatter is missing "${key}"`)
    }
  }

  const order = Number(fields.get('order'))

  if (!Number.isInteger(order) || order < 1) {
    throw new Error(`${name}: "order" must be a positive integer`)
  }

  return {
    frontmatter: {
      group: fields.get('group') ?? '',
      order,
      summary: fields.get('summary') ?? '',
    },
    body: raw.slice(raw.indexOf('\n', end + 1) + 1).replace(/^\n+/, ''),
  }
}

/** Summaries are written for the markdown index, so they carry emphasis a `title` attribute cannot. */
export function plainText(markdown: string): string {
  return markdown.replace(/[*`]/g, '')
}
