import type { Dictionary } from '../../dictionary'

import { studioChrome } from './studio-chrome'
import { studioDocuments } from './studio-documents'
import { studioExport } from './studio-export'
import { studioPanels } from './studio-panels'
import { studioTheme } from './studio-theme'

export const studio: Dictionary['studio'] = {
  chrome: studioChrome,
  panels: studioPanels,
  documents: studioDocuments,
  export: studioExport,
  theme: studioTheme,
}
