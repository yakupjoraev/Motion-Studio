'use client'

import dynamic from 'next/dynamic'
import { type ReactElement, useCallback, useRef, useState } from 'react'

import type { ColorHit } from './color-swatches'
import { EDITOR_HEIGHT, EditorSkeleton } from './editor-skeleton'
import { PresetPanel } from './preset-panel'
import { type PlaygroundProperty, propertyDescriptor, styleFor } from './properties'
import { PropertyList } from './property-list'
import { TargetFrame } from './target-frame'
import { PropertyTarget } from './targets/property-target'
import { useApplyCss } from './use-apply-css'

/**
 * PLAYGROUND.md § Layout: properties on the left, the target in the middle, presets on the right, the
 * editor along the bottom.
 *
 * The editor is `next/dynamic` with `ssr: false` and a skeleton at its exact height — PERFORMANCE.md
 * § Mandatory dynamic imports puts CodeMirror at ~110 kB, and a page that shipped it in the first
 * chunk would be paying for an editor before anyone had chosen a property.
 */
const CodeEditorIsland = dynamic(
  () => import('./code-editor').then((module) => module.CodeEditor),
  { ssr: false },
)

/**
 * PERFORMANCE.md § Mandatory dynamic imports lists the colour picker at ~18 kB, "loads when a colour
 * control opens". A swatch is that control, and a reader who never clicks one should not pay for it.
 */
const SwatchPickerIsland = dynamic(
  () => import('./swatch-picker').then((module) => module.SwatchPicker),
  { ssr: false },
)

export function PlaygroundLayout(): ReactElement {
  const [property, setProperty] = useState<PlaygroundProperty>('background')
  const descriptor = propertyDescriptor(property)
  const target = useRef<HTMLDivElement | null>(null)
  const { value, setValue, applyNow, applied, errors } = useApplyCss(
    property,
    target,
    descriptor.initial,
  )
  const [copied, setCopied] = useState(false)
  const [colorHit, setColorHit] = useState<ColorHit | undefined>(undefined)
  const [editorReady, setEditorReady] = useState(false)
  const onEditorReady = useCallback(() => setEditorReady(true), [])

  const onCopy = useCallback(() => {
    void navigator.clipboard?.writeText(`${property}: ${value};`).then(() => setCopied(true))
  }, [property, value])

  /** The swatch decorated a range of the value, so a new colour is a splice rather than a re-parse. */
  const onColorChange = useCallback(
    (color: string) => {
      setColorHit((hit) => {
        if (hit === undefined) {
          return undefined
        }

        setValue(`${value.slice(0, hit.from)}${color}${value.slice(hit.to)}`)

        return { ...hit, value: color, to: hit.from + color.length }
      })
    },
    [setValue, value],
  )

  return (
    <div className="grid h-full grid-rows-[1fr_auto] gap-4 p-4">
      <div className="grid min-h-0 grid-cols-1 gap-4 lg:grid-cols-[16rem_1fr_14rem]">
        <aside aria-label="Properties" className="min-h-0 overflow-y-auto">
          <PropertyList value={property} onValueChange={setProperty} />
        </aside>
        <div className="grid min-h-0 place-items-center overflow-auto">
          <TargetFrame>
            <PropertyTarget
              property={property}
              targetRef={target}
              applied={applied}
              initialStyle={styleFor(property, descriptor.initial)}
            />
          </TargetFrame>
        </div>
        <aside aria-label="Presets" className="min-h-0">
          <PresetPanel property={property} value={value} onValueChange={setValue} onCopy={onCopy} />
        </aside>
      </div>
      <div className="flex flex-col gap-2">
        {/*
          The placeholder sits under the editor at the same height rather than beside it: the reader
          sees the value immediately, and nothing moves when CodeMirror lands on top of it.
        */}
        <div className="relative" style={{ minHeight: EDITOR_HEIGHT }}>
          {!editorReady && (
            <div className="absolute inset-0">
              <EditorSkeleton value={value} />
            </div>
          )}
          <CodeEditorIsland
            value={value}
            onChange={setValue}
            onApply={applyNow}
            errors={errors}
            label={`${descriptor.label} value`}
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
        <output aria-live="polite" className="min-h-5 text-danger text-xs">
          {errors.length === 0 ? '' : `Line ${errors[0]?.line}: ${errors[0]?.message}`}
        </output>
        <output aria-live="polite" className="sr-only">
          {copied ? 'CSS copied to the clipboard.' : ''}
        </output>
      </div>
    </div>
  )
}
