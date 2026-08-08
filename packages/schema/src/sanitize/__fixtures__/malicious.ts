/**
 * One payload per row of FILE_FORMAT.md § Security. They are fixtures rather than inline literals so
 * the sanitizer tests and the CSS tests attack the same strings, and so adding a row to the table
 * means adding an entry here that something must then neutralise.
 */
export const MALICIOUS_URLS = {
  javascript: 'javascript:alert(1)',
  /** A control character inside the scheme, which browsers strip before resolving. */
  javascriptSplit: 'java\u0000script:alert(1)',
  dataHtml: 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
  vbscript: 'vbscript:msgbox(1)',
  fileScheme: 'file:///etc/passwd',
} as const

export const SAFE_URLS = {
  https: 'https://example.com/a?b=c#d',
  http: 'http://example.com',
  mailto: 'mailto:hi@example.com',
  relative: '/studio',
  fragment: '#features',
} as const

export const MALICIOUS_CSS = {
  url: 'background-image: url(https://evil.example.com/x.png)',
  urlSpaced: 'url ("https://evil.example.com/x.png")',
  import: '@import url("https://evil.example.com/x.css")',
  expression: 'width: expression(alert(1))',
  behavior: 'behavior: url(#default#time2)',
  mozBinding: '-moz-binding: url(https://evil.example.com/x.xml#xss)',
  element: 'background: element(#target)',
  comment: 'red /* url( */',
  escape: 'u\\rl(https://evil.example.com/x.png)',
  unbalanced: 'rgb(0, 0, 0',
  semicolon: 'red; position: fixed',
  brace: '} body { display: none',
} as const

export const SAFE_CSS = {
  colour: 'rgb(12 12 16 / 60%)',
  shadow: '0 1px 2px rgba(0,0,0,.4), inset 0 0 0 1px rgb(255 255 255 / 6%)',
  gradient: 'linear-gradient(180deg, #101014 0%, #1a1a22 100%)',
  clip: 'polygon(0 0, 100% 0, 100% 80%, 0 100%)',
} as const

export const MALICIOUS_RICH_TEXT = {
  script: 'Hello <script>alert(1)</script> world',
  onError: '<img src=x onerror="alert(1)">caption',
  iframe: '<iframe src="https://evil.example.com"></iframe>text',
  javascriptLink: '<a href="javascript:alert(1)">click</a>',
  styleTag: '<style>body{display:none}</style>kept',
  unclosed: '<strong>bold',
  nestedUnknown: '<div><span><strong>deep</strong></span></div>',
} as const

/** A blur placeholder that is really a full image, and a node name used as a payload. */
export const OVERSIZED = {
  dataUrl: `data:image/png;base64,${'A'.repeat(3_000_000)}`,
  blurDataUrl: `data:image/webp;base64,${'A'.repeat(10_000)}`,
  nodeName: 'x'.repeat(100_000),
  wrongType: `data:application/pdf;base64,${'A'.repeat(16)}`,
} as const
