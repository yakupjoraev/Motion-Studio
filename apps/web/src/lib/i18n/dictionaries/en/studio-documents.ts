import type { PluralForms } from '../../plural'

/** The five document dialogs, and the toasts the session raises around them. */
export const studioDocuments = {
  listTitle: 'Documents',
  listDescription: 'Everything saved in this browser. Nothing here has left the machine.',
  listEmpty: 'No documents yet. The one you are editing appears here once it saves.',
  documentName: 'Document name',
  open: 'Open',
  rename: 'Rename',
  /** `{name}` is the document the action would act on. */
  renameOne: 'Rename {name}',
  deleteOne: 'Delete {name}',
  duplicateOne: 'Duplicate {name}',
  blockCount: { one: '{count} block', other: '{count} blocks' } as PluralForms,

  importTitle: 'Import a document',
  importDescription:
    'A .motion file from this or another machine. Everything is checked before it opens.',
  downloadOriginal: 'Download original',
  continue: 'Continue',
  tryAnotherFile: 'Try another file',
  untouched: 'The document you have open was not touched.',
  dropHere: 'Drop a .motion file here, or paste one with the keyboard.',
  chooseFile: 'Choose a file',
  /** `{name}` is the document inside the file. */
  readyToOpen: 'Ready to open “{name}”.',
  /** `{name}` the document, `{count}` how many repairs the reader made. */
  openingWithRepairs: {
    one: 'Opening “{name}” with {count} repair.',
    other: 'Opening “{name}” with {count} repairs.',
  } as PluralForms,
  nothingRepaired: 'Nothing needed repairing. The file opened as it was written.',
  repairedPrefix: 'Repaired: ',
  notePrefix: 'Note: ',

  saveAsTitle: 'Save as',
  saveAsDescription: 'The copy becomes the open document. The original keeps everything it has.',
  name: 'Name',
  cancel: 'Cancel',
  saveCopy: 'Save a copy',

  newTitle: 'New document',
  newDescription: 'Start from a page that is already built, or from nothing at all.',
  emptyPreview: 'Empty',
  blank: 'Blank',
  blankDescription: 'One root container. The canvas says what to do next.',

  versionsTitle: 'Version history',
  versionsDescription:
    'The last ten versions of this document. Restoring one is an edit, so it undoes.',
  versionsEmpty: 'No versions yet. One is kept whenever the document changes materially.',
  latest: 'Latest',
  restore: 'Restore',
  versionGone: 'That version is no longer stored',
  saveRefusedTitle: 'Could not save the new document',
  saveRefusedBody: 'It is open and editable. Storage refused the write.',

  recoveryTitle: 'Your last document could not be opened',
  recoveryBody: 'It is still stored in this browser. Download it, then start from a new one.',
  recoveryAction: 'Download it',
  copiedAsJson: 'Copied the document as JSON',
  /** `{name}` is the document that was deleted. */
  deleted: 'Deleted {name}',
  /** The name a duplicate is given. It lands in the document, so it follows the session. */
  copyOf: '{name} copy',
}
