export const errors = {
  notFoundCode: '404',
  notFoundTitle: 'That page does not exist',
  notFoundBody:
    'The address is wrong or the page has moved. The block catalogue and the studio are both still here.',
  browseBlocks: 'Browse blocks',
  openStudio: 'Open the studio',

  routeTitle: 'This page stopped working',
  routeBody:
    'The page failed to render. Your saved work is untouched — download it here, then try again or go back to the blocks.',
  downloadSaved: 'Download saved document',
  tryAgain: 'Try again',
  goToBlocks: 'Go to blocks',
  copyReport: 'Copy report',
  copied: 'Copied',
  nothingSent: 'Nothing is sent automatically.',
  downloadDocument: 'Download document',
  downloadedFromSession: 'Downloaded from this session.',
  downloadedFromAutosave: 'Downloaded from the last autosave.',
  downloadedFromUnload: 'Downloaded from the last save before the tab closed.',
  nothingRecovered: 'No document could be recovered from this browser.',

  canvasStopped: 'The canvas stopped rendering.',
  canvasKeepDocument: 'Your document is still in this browser. Download it before reloading.',
  resetViewport: 'Reset viewport',
  reload: 'Reload',

  exportFailed:
    'The export failed while printing. Nothing was written. Copy the document as JSON instead, or try again.',
  exportFlagged: 'What the export had already flagged',

  /** `{name}` is the block that threw. */
  nodeFailed: '{name} failed to render.',
  nodeAdvice: 'Reset its props or delete the block.',
  resetToDefaults: 'Reset to defaults',
  select: 'Select',
  replaceWithPlaceholder: 'Replace with a placeholder',
  deleteBlock: 'Delete block',
  placeholderBody:
    '{name} is not being rendered. Its block still holds your content — edit it in the inspector, or try it again.',
  tryBlockAgain: 'Try the block again',

  /** `{section}` is the inspector section whose controls threw. */
  sectionFailed:
    '{section} controls failed to render. The other sections still work. Try again, or download the document.',
  download: 'Download',
}
