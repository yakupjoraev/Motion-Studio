import type { Dictionary } from '../../dictionary'

import { studioChrome } from './studio-chrome'
import { studioPanels } from './studio-panels'

export const studio: Dictionary['studio'] = {
  chrome: studioChrome,
  panels: studioPanels,
}
