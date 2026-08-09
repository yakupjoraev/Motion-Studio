import { heroAppPreviewDefinition } from './hero-app-preview/hero-app-preview.definition'
import { heroAuroraDefinition } from './hero-aurora/hero-aurora.definition'
import { heroCenteredDefinition } from './hero-centered/hero-centered.definition'
import { heroSplitDefinition } from './hero-split/hero-split.definition'
import { heroTerminalDefinition } from './hero-terminal/hero-terminal.definition'
import { heroVideoDefinition } from './hero-video/hero-video.definition'

/**
 * Metadata only, reached through each block's `.definition` file rather than through its `index`: an
 * index re-exports the component, and one React import anywhere in this graph is what would stop
 * `codegen` from running under `node` (ADR-107).
 */
// COMPONENT_LIBRARY.md § Catalogue order, which is the order the palette groups them in.
export const definitions = {
  'hero-centered': heroCenteredDefinition,
  'hero-split': heroSplitDefinition,
  'hero-aurora': heroAuroraDefinition,
  'hero-video': heroVideoDefinition,
  'hero-terminal': heroTerminalDefinition,
  'hero-app-preview': heroAppPreviewDefinition,
} as const
