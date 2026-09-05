import type { PluralForms } from '../../plural'

export const gallery = {
  metaTitle: 'Blocks — Motion Studio',
  metaDescription:
    'Seventy-two production components, each one live on this page. Open any of them, change its props, and take the React it prints.',
  eyebrow: 'The catalogue',
  heading: 'Every block, running.',
  intro:
    'Not a page of screenshots. Each card below is the component itself, rendered by the same registry the editor draws from. Open one to change its props and copy the source it prints.',
  searchLabel: 'Search the catalogue',
  searchPlaceholder: 'Search 72 blocks by name, tag or description',
  blockCount: { one: '{count} block', other: '{count} blocks' } as PluralForms,
  /** After a filter: "12 of 72 blocks". */
  blockCountFiltered: {
    one: '{count} of {total} block',
    other: '{count} of {total} blocks',
  } as PluralForms,

  detail: {
    breadcrumb: '← All blocks',
    notFoundTitle: 'Not found — Motion Studio',
    propsHeading: 'Props',
    propsRegion: 'Props',
    propsEmpty: 'This block takes no props.',
    propColumn: 'Prop',
    typeColumn: 'Type',
    defaultColumn: 'Default',
    descriptionColumn: 'Description',
    responsiveTitle: 'Can be set per breakpoint',
    accessibilityHeading: 'Accessibility',
    role: 'Role',
    sourceHeading: 'The code it prints',
    copyReact: 'Copy React',
    copied: 'Copied',
    copyAnnouncement: 'Component source copied to the clipboard',
    copyFailed: 'The browser would not give access to the clipboard',
    exporterFallback: 'The exporter did not load, so this is the source for the block’s defaults.',
    lineCount: { one: '{count} line · react', other: '{count} lines · react' } as PluralForms,
    propsPanel: 'props',
    reset: 'Reset',
    previewTheme: 'Preview theme',
    previewWidth: 'Preview width',
    /** `{paths}` are the query parameters the URL set. */
    rejectedOne:
      'The link set {paths} to a value this block does not take. It is showing the default instead.',
    rejectedMany:
      'The link set {paths} to values this block does not take. They are showing the default instead.',
  },
}
