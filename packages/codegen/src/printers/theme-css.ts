import { toTailwind } from '@motion-studio/tokens'

/**
 * The theme as a stylesheet — ADR-262. Three parts, and the export is wrong without any one of them:
 *
 * 1. `@theme`, Tailwind v4's utility namespaces pointing at the runtime variables. Without it the
 *    generated `bg-surface-1` and `text-display-2` name nothing and the page renders at browser
 *    defaults.
 * 2. The variables themselves, which the caller resolved from the document's theme.
 * 3. The base layer that paints them. A page whose variables say Studio Dark on a white background is
 *    a page that has the theme in its files and not on its screen.
 *
 * It is the layer `apps/web` sets, minus the studio's own colour-mode transition — the exported page
 * has no `data-theme-ready` and nothing to animate from.
 */
export const BASE_LAYER = `@layer base {
  :root {
    color-scheme: light;
  }

  :root[data-color-mode='dark'] {
    color-scheme: dark;
  }

  body {
    background-color: var(--ms-color-surface-0);
    color: var(--ms-color-foreground);
    font-family: var(--ms-font-sans);
    font-size: var(--ms-text-md);
    line-height: var(--ms-text-md-line-height);
    -webkit-font-smoothing: antialiased;
  }

  :focus-visible {
    outline: none;
    box-shadow: var(--ms-shadow-focus);
  }
}`

export const themeStylesheet = (css: string): string =>
  [toTailwind(), css.trim(), BASE_LAYER].join('\n\n')
