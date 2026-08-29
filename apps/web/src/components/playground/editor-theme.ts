import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { EditorView } from '@codemirror/view'
import { tags } from '@lezer/highlight'

import { EDITOR_HEIGHT } from './editor-skeleton'

/**
 * The editor painted from the same tokens as everything else — PLAYGROUND.md § Editor, "our theme,
 * generated from the same tokens". Every colour here is a `var(--ms-*)`, so a colour-mode switch
 * repaints the editor with the page instead of leaving a light box in a dark app.
 */
export const editorTheme = EditorView.theme({
  '&': {
    height: `${EDITOR_HEIGHT}px`,
    fontSize: 'var(--ms-text-sm)',
    backgroundColor: 'var(--ms-color-surface-1)',
    color: 'var(--ms-color-foreground)',
    border: '1px solid var(--ms-color-border)',
    borderRadius: 'var(--ms-radius-md)',
  },
  '&.cm-focused': {
    outline: '2px solid var(--ms-color-accent-ring)',
    outlineOffset: '2px',
  },
  '.cm-scroller': {
    fontFamily: 'var(--ms-font-mono)',
    lineHeight: '1.6',
  },
  '.cm-gutters': {
    backgroundColor: 'var(--ms-color-surface-2)',
    color: 'var(--ms-color-foreground-subtle)',
    border: 'none',
  },
  '.cm-activeLine': { backgroundColor: 'var(--ms-color-surface-2)' },
  '.cm-activeLineGutter': { backgroundColor: 'var(--ms-color-surface-3)' },
  '.cm-cursor': { borderLeftColor: 'var(--ms-color-foreground)' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': {
    backgroundColor: 'var(--ms-color-accent-muted)',
  },
  '.cm-tooltip': {
    backgroundColor: 'var(--ms-color-surface-2)',
    border: '1px solid var(--ms-color-border)',
    borderRadius: 'var(--ms-radius-sm)',
    color: 'var(--ms-color-foreground)',
  },
  /* The inline swatch — a square in the text, sized to the line it sits on. */
  '.ms-color-swatch': {
    display: 'inline-block',
    width: '0.8em',
    height: '0.8em',
    marginRight: '0.3em',
    padding: '0',
    verticalAlign: '-0.05em',
    border: '1px solid var(--ms-color-border-strong)',
    borderRadius: '2px',
    cursor: 'pointer',
  },
  '.ms-color-swatch:focus-visible': {
    outline: '2px solid var(--ms-color-accent-ring)',
    outlineOffset: '1px',
  },
  '.cm-lintRange-error': {
    // The underline the document asks for, drawn rather than imported as a background image.
    textDecoration: 'underline wavy var(--ms-color-danger)',
    textUnderlineOffset: '3px',
  },
})

/** Four token groups, which is all a CSS value has: a function, a number, a keyword and a string. */
export const editorHighlight = syntaxHighlighting(
  HighlightStyle.define([
    { tag: tags.propertyName, color: 'var(--ms-color-accent)' },
    { tag: tags.function(tags.variableName), color: 'var(--ms-color-info)' },
    { tag: tags.number, color: 'var(--ms-color-warning)' },
    { tag: tags.unit, color: 'var(--ms-color-warning)' },
    { tag: tags.keyword, color: 'var(--ms-color-accent)' },
    { tag: tags.atom, color: 'var(--ms-color-success)' },
    { tag: tags.string, color: 'var(--ms-color-success)' },
    { tag: tags.comment, color: 'var(--ms-color-foreground-subtle)', fontStyle: 'italic' },
    { tag: tags.punctuation, color: 'var(--ms-color-foreground-muted)' },
  ]),
)
