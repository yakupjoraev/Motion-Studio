/**
 * One payload per row of FILE_FORMAT.md § Security. They are fixtures rather than inline literals so
 * the sanitizer tests and the CSS tests attack the same strings, and so adding a row to the table
 * means adding an entry here that something must then neutralise.
 *
 * The CSS row's payloads live beside the validator, in `css/__fixtures__/malicious.ts`.
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
