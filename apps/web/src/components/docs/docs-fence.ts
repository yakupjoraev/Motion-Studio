import { type Language, parseHighlightLines } from '@motion-studio/blocks/highlight'

export interface Fence {
  readonly language: Language
  readonly label: string
  readonly filename: string | undefined
  readonly highlight: readonly number[]
}

/**
 * ADR-308's alias map. The left side is what the corpus writes on a fence; the right side is what the
 * tokeniser has rules for. `yaml` goes to `bash` because both mark comments with `#` and quote their
 * strings the same way.
 */
const ALIASES: Readonly<Record<string, Language>> = {
  bash: 'bash',
  css: 'css',
  dockerfile: 'bash',
  html: 'html',
  js: 'js',
  json: 'json',
  jsonc: 'json',
  jsx: 'jsx',
  markdown: 'plain',
  md: 'plain',
  sh: 'bash',
  shell: 'bash',
  svg: 'html',
  text: 'plain',
  ts: 'ts',
  tsx: 'tsx',
  yaml: 'bash',
  yml: 'bash',
}

const LABELS: Readonly<Record<string, string>> = {
  bash: 'Shell',
  css: 'CSS',
  dockerfile: 'Dockerfile',
  html: 'HTML',
  js: 'JavaScript',
  json: 'JSON',
  jsonc: 'JSON',
  jsx: 'JSX',
  markdown: 'Markdown',
  md: 'Markdown',
  sh: 'Shell',
  shell: 'Shell',
  svg: 'SVG',
  text: 'Text',
  ts: 'TypeScript',
  tsx: 'TSX',
  yaml: 'YAML',
  yml: 'YAML',
}

/** ```` ```ts {4-6} title="next.config.ts" ```` — everything after the language is optional. */
export function parseFence(info: string | undefined): Fence {
  const source = (info ?? '').trim()
  const name = (source.split(/\s+/)[0] ?? '').toLowerCase()
  const highlight = /\{([^}]*)\}/.exec(source)
  const filename = /title="([^"]+)"/.exec(source)

  return {
    language: ALIASES[name] ?? 'plain',
    label: LABELS[name] ?? (name === '' ? 'Text' : name),
    filename: filename?.[1],
    highlight: highlight === null ? [] : parseHighlightLines(highlight[1] ?? ''),
  }
}
