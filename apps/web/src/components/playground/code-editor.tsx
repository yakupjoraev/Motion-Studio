'use client'

import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap, toggleComment } from '@codemirror/commands'
import { css } from '@codemirror/lang-css'
import { bracketMatching, indentOnInput } from '@codemirror/language'
import { type Diagnostic, forceLinting, lintGutter, linter } from '@codemirror/lint'
import { selectNextOccurrence } from '@codemirror/search'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap, lineNumbers } from '@codemirror/view'
import { type ReactElement, useEffect, useRef } from 'react'

import type { CssError } from '@motion-studio/schema/css'

import { type ColorHit, colorHitField, colorSwatches } from './color-swatches'
import { editorHighlight, editorTheme } from './editor-theme'

/**
 * The editor — PLAYGROUND.md § Editor. CodeMirror 6 rather than Monaco, for the reason TECH_STACK.md
 * gives: two megabytes for a CSS box is not a trade, it is a mistake.
 *
 * It is mounted through `next/dynamic` (see `playground-layout.tsx`), so none of this is in the first
 * chunk. React owns the value; CodeMirror owns the document, and the two are reconciled in one place —
 * an editor that also held the value would let them disagree while the reader watched.
 */
export interface CodeEditorProps {
  readonly value: string
  readonly onChange: (value: string) => void
  /** `Cmd+Enter`, which skips the debounce — § Editor. */
  readonly onApply: () => void
  readonly errors: readonly CssError[]
  readonly label: string
  readonly onColorClick?: ((hit: ColorHit) => void) | undefined
  /** Fires once the instance is mounted, so the placeholder underneath can be dropped. */
  readonly onReady?: (() => void) | undefined
}

/**
 * Our errors, in CodeMirror's shape. The underline starts at the column the validator names and runs
 * to the end of the line: the character it points at is the one to look at, and the rest of the line
 * is the context that makes it readable.
 */
function diagnosticsFor(state: EditorState, errors: readonly CssError[]): Diagnostic[] {
  return errors.map((error) => {
    const line = state.doc.line(Math.min(Math.max(error.line, 1), state.doc.lines))
    // An empty range renders no underline, so the last character of the line is the floor.
    const from = Math.min(
      line.from + Math.max(error.column - 1, 0),
      Math.max(line.to - 1, line.from),
    )

    return { from, to: line.to, severity: error.severity, message: error.message } as const
  })
}

export function CodeEditor({
  value,
  onChange,
  onApply,
  errors,
  label,
  onColorClick,
  onReady,
}: CodeEditorProps): ReactElement {
  const host = useRef<HTMLDivElement | null>(null)
  const view = useRef<EditorView | null>(null)
  const latest = useRef({ onChange, onApply, onColorClick, errors })
  /** The document the editor opens with. Read once: after that CodeMirror owns the text. */
  const initial = useRef(value)

  latest.current = { onChange, onApply, onColorClick, errors }

  useEffect(() => {
    const parent = host.current

    if (parent === null) {
      return
    }

    const editor = new EditorView({
      parent,
      state: EditorState.create({
        doc: initial.current,
        extensions: [
          lineNumbers(),
          history(),
          bracketMatching(),
          closeBrackets(),
          indentOnInput(),
          autocompletion(),
          lintGutter(),
          css(),
          editorTheme,
          editorHighlight,
          colorSwatches,
          linter((instance) => diagnosticsFor(instance.state, latest.current.errors)),
          keymap.of([
            {
              key: 'Mod-Enter',
              run: () => {
                latest.current.onApply()

                return true
              },
            },
            { key: 'Mod-/', run: toggleComment },
            { key: 'Mod-d', run: selectNextOccurrence },
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...historyKeymap,
            ...completionKeymap,
          ]),
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({ 'aria-label': label }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              latest.current.onChange(update.state.doc.toString())
            }

            const hit = update.state.field(colorHitField)

            if (hit !== undefined && update.startState.field(colorHitField) !== hit) {
              latest.current.onColorClick?.(hit)
            }
          }),
        ],
      }),
    })

    view.current = editor
    onReady?.()

    return () => {
      editor.destroy()
      view.current = null
    }
    /*
     * Created once. `value`, the callbacks and the diagnostics are reconciled by the effects below:
     * re-creating the editor on a keystroke would take the cursor and the undo history with it.
     */
  }, [label, onReady])

  /** The document follows the value when the value changed somewhere else — a preset, a property. */
  useEffect(() => {
    const editor = view.current

    if (editor === null || editor.state.doc.toString() === value) {
      return
    }

    editor.dispatch({
      changes: { from: 0, to: editor.state.doc.length, insert: value },
    })
  }, [value])

  /** New diagnostics are a lint refresh, not a new editor. */
  useEffect(() => {
    const editor = view.current

    if (editor === null) {
      return
    }

    latest.current.errors = errors
    forceLinting(editor)
  }, [errors])

  return <div ref={host} data-testid="code-editor" className="w-full" />
}
