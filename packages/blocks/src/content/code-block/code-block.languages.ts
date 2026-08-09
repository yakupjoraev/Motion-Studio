/**
 * The language list lives apart from the tokeniser on purpose. A block's `.definition` is metadata —
 * `registry.node.test.ts` walks its import graph and requires it to stay free of React *and* of the
 * algorithms the components run, so `codegen` can import the registry under `node`. The definition
 * needs the list of languages to build a control; it has no business pulling in a tokeniser to get it.
 */
export const LANGUAGES = ['plain', 'ts', 'js', 'tsx', 'jsx', 'json', 'css', 'html', 'bash'] as const

export type Language = (typeof LANGUAGES)[number]
