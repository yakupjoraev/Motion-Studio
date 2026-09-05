import { studioChrome } from './studio-chrome'
import { studioDocuments } from './studio-documents'
import { studioExport } from './studio-export'
import { studioPanels } from './studio-panels'
import { studioTheme } from './studio-theme'

/**
 * The studio, split the way a person works in it: the chrome around the canvas, and the panels
 * inside it. Two files rather than one table, because the chrome is what every session sees and the
 * panels are what a session that starts editing sees.
 */
export const studio = {
  chrome: studioChrome,
  panels: studioPanels,
  documents: studioDocuments,
  export: studioExport,
  theme: studioTheme,
}
