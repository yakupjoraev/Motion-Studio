/**
 * The chrome around the documentation, not the documentation itself: ADR-366 defers the document
 * bodies, and this is the shell the owner did ask for — navigation, search, breadcrumbs, pager.
 */
export const docs = {
  metaTitle: 'Documentation — Motion Studio',
  metaDescription:
    'The specification this product was built from: 28 documents, the decisions behind them, and the reading paths through them.',
  indexEyebrow: 'The specification',
  breadcrumbRoot: 'Docs',
  breadcrumbLabel: 'Breadcrumb',
  sidebarLabel: 'Documentation',
  sidebarIndex: 'Index',
  navExpand: 'All documents',
  navCollapse: 'Hide the list',
  tocLabel: 'On this page',
  pagerLabel: 'Previous and next document',
  previous: 'Previous',
  next: 'Next',
  calloutLabel: 'Note',
  searchTrigger: 'Search',
  searchTitle: 'Search the documentation',
  searchDescription: 'Search every document and every section by name.',
  searchPlaceholder: 'Type a document or a section…',
  searchListLabel: 'Documentation',
  searchFailed: 'The search index did not load. Every document is still in the sidebar.',
  searchLoading: 'Loading the index…',
  /** `{query}` is what the reader typed. */
  searchEmpty: 'Nothing matches “{query}”.',
  copyCode: 'Copy',
  copyCodeCopied: 'Copied',
  copyCodeFailed: 'The browser would not give access to the clipboard',
  copyCodeAnnouncement: 'Code sample copied to the clipboard',
  /** `{label}` is the language of the fence, `{ordinal}` its position on the page. */
  codeSampleName: '{label} sample {ordinal}',
  /**
   * The one sentence the reader needs about ADR-366: the chrome is translated, the documents are
   * not. Shown once, above the article, in a Russian session only — an English session has nothing
   * to explain.
   */
  englishBodies: '',
}
