'use client'

import type { CssError, CssFeature } from '@motion-studio/schema/css'
import dynamic from 'next/dynamic'
import { type ReactElement, useCallback, useState } from 'react'

import type { ColorHit } from './color-swatches'
import { CompatNotes } from './compat-notes'
import { EDITOR_HEIGHT, EditorSkeleton } from './editor-skeleton'

/**
 * PERFORMANCE.md § Mandatory dynamic imports: CodeMirror is ~110 kB and the colour picker ~18 kB.
 * Neither is in the page's first load, and the skeleton reserves the editor's exact height so nothing
 * moves when it lands.
 */
const CodeEditorIsland = dynamic(
  () => import('./code-editor').then((module) => module.CodeEditor),
  { ssr: false },
)

const SwatchPickerIsland = dynamic(
  () => import('./swatch-picker').then((module) => module.SwatchPicker),
  { ssr: false },
)

export interface EditorPaneProps {
  readonly label: string
  readonly value: string
  onValueChange: (next: string) => void
  onApply: () => void
  readonly errors: readonly CssError[]
  readonly features: readonly CssFeature[]
}

export function EditorPane({
  label,
  value,
  onValueChange,
  onApply,
  errors,
  features,
}: EditorPaneProps): ReactElement {
  const [colorHit, setColorHit] = useState<ColorHit | undefined>(undefined)
  const [editorReady, setEditorReady] = useState(false)
  const onEditorReady = useCallback(() => setEditorReady(true), [])

  /** The swatch decorated a range of the value, so a new colour is a splice rather than a re-parse. */
  const onColorChange = useCallback(
    (color: string) => {
      setColorHit((hit) => {
        if (hit === undefined) {
          return undefined
        }

        onValueChange(`${value.slice(0, hit.from)}${color}${value.slice(hit.to)}`)

        return { ...hit, value: color, to: hit.from + color.length }
      })
    },
    [onValueChange, value],
  )

  return (
    <div className="flex flex-col gap-2">
      <div className="relative" style={{ minHeight: EDITOR_HEIGHT }}>
        {!editorReady && (
          <div className="absolute inset-0">
            <EditorSkeleton value={value} />
          </div>
        )}
        <CodeEditorIsland
          value={value}
          onChange={onValueChange}
          onApply={onApply}
          errors={errors}
          label={label}
          onColorClick={setColorHit}
          onReady={onEditorReady}
        />
      </div>
      {colorHit !== undefined && (
        <SwatchPickerIsland
          hit={colorHit}
          onChange={onColorChange}
          onClose={() => setColorHit(undefined)}
        />
      )}
      {/*
        ACCESSIBILITY.md § Playground: diagnostics in a polite region. The editor underlines them as
        they happen; this is the sentence a screen-reader user gets, and it is the last one rather
        than a running commentary.
      */}
      <output
        aria-live="polite"
        data-testid="playground-error"
        className="min-h-5 text-danger text-xs"
      >
        {errors.length === 0
          ? ''
          : `Line ${errors[0]?.line}, column ${errors[0]?.column}: ${errors[0]?.message}`}
      </output>
      <CompatNotes features={features} />
    </div>
  )
}
