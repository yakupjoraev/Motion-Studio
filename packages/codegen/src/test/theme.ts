import type { PrintedTheme } from '../printers/printer.types'

/**
 * The printed theme, injected the way the preset catalogue is — ADR-232. `codegen` may not import
 * `packages/theme`, so this is what `toCssVariables(resolveForExport(config))` and `COLOR_MODE_SCRIPT`
 * hand over, written out rather than resolved.
 *
 * It is short on purpose. A golden file that carried the whole resolved variable set would change every
 * time somebody retuned a ramp, and the thing under test here is where the stylesheet lands and what
 * surrounds it — not the palette, which `packages/theme` tests for itself.
 */
export const FIXTURE_THEME_CSS = `/*
 * Theme: Fixture
 */

:root {
  --ms-color-surface-0: oklch(98.5% 0.0014 285);
  --ms-color-surface-1: oklch(100% 0 0);
  --ms-color-foreground: oklch(14% 0.0056 285);
  --ms-color-accent: oklch(62% 0.19 285);
  --ms-font-sans: 'Geist Sans', system-ui, sans-serif;
  --ms-font-display: 'Geist Sans', system-ui, sans-serif;
  --ms-font-mono: 'Geist Mono', ui-monospace, monospace;
}

:root[data-color-mode='dark'] {
  --ms-color-surface-0: oklch(14% 0.0056 285);
  --ms-color-surface-1: oklch(17.5% 0.007 285);
  --ms-color-foreground: oklch(98.5% 0.0014 285);
  --ms-color-accent: oklch(70% 0.17 285);
}

@media (prefers-color-scheme: dark) {
  :root:not([data-color-mode]) {
    --ms-color-surface-0: oklch(14% 0.0056 285);
    --ms-color-surface-1: oklch(17.5% 0.007 285);
    --ms-color-foreground: oklch(98.5% 0.0014 285);
    --ms-color-accent: oklch(70% 0.17 285);
  }
}
`

/** `COLOR_MODE_SCRIPT`, character for character. A paraphrase here would test a script nobody ships. */
export const FIXTURE_COLOR_MODE_SCRIPT =
  "try{var m=localStorage.getItem('ms-color-mode');if(m==='light'||m==='dark'){document.documentElement.dataset.colorMode=m}}catch(e){}"

export const fixtureTheme = (): PrintedTheme => ({
  css: FIXTURE_THEME_CSS,
  colorModeScript: FIXTURE_COLOR_MODE_SCRIPT,
})
