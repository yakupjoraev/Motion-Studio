'use client'

import type { MouseEvent, ReactElement } from 'react'

import { PRESETS, type Preset } from './presets'
import { type PlaygroundProperty, propertyDescriptor } from './properties'

/**
 * PLAYGROUND.md § Presets. A click replaces the editor's content; `Alt+click` appends the preset as
 * another layer where the property takes a comma-separated list — a shadow stack is built by adding to
 * it, and retyping the first three layers to try a fourth is the tedium the panel exists to remove.
 *
 * Every preset is a labelled button and the swatch is `aria-hidden`: a gradient is not a name.
 */
export interface PresetPanelProps {
  readonly property: PlaygroundProperty
  readonly value: string
  readonly onValueChange: (value: string) => void
}

/** The layer separator the CSS list forms take: a comma, and a newline so the result stays readable. */
export const appendLayer = (value: string, layer: string): string =>
  value.trim() === '' ? layer : `${value.trimEnd().replace(/,$/, '')},\n  ${layer}`

export function PresetPanel({ property, value, onValueChange }: PresetPanelProps): ReactElement {
  const { layerable } = propertyDescriptor(property)
  const presets = PRESETS[property]

  const onPresetClick = (event: MouseEvent<HTMLButtonElement>, preset: Preset): void => {
    const append = layerable && event.altKey

    onValueChange(append ? appendLayer(value, preset.value) : preset.value)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="m-0 font-medium text-foreground text-sm">Presets</h2>
        <p className="m-0 text-foreground-muted text-xs">
          {layerable
            ? 'Click to replace, Alt-click to add a layer.'
            : 'Click to replace the value.'}
        </p>
      </div>
      <ul className="m-0 flex min-h-0 flex-1 list-none flex-col gap-1 overflow-y-auto p-0">
        {presets.map((preset) => (
          <li key={preset.name}>
            <button
              type="button"
              onClick={(event) => onPresetClick(event, preset)}
              className="flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-foreground-muted text-sm transition-colors [transition-duration:var(--ms-duration-fast)] hover:bg-surface-2 hover:text-foreground focus-visible:outline-2 focus-visible:outline-accent-ring focus-visible:outline-offset-2"
            >
              <span
                aria-hidden="true"
                data-testid="preset-swatch"
                className="size-6 shrink-0 rounded-sm border border-border"
                style={swatchStyle(preset.swatch)}
              />
              {preset.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * The swatch is a declaration list from `presets.ts`, parsed here rather than stored as an object: the
 * table reads as CSS, which is what it is, and this is the one place that has to turn it into a style.
 */
function swatchStyle(declarations: string): Record<string, string> {
  const style: Record<string, string> = {}

  for (const declaration of declarations.split(';')) {
    const index = declaration.indexOf(':')

    if (index === -1) {
      continue
    }

    const property = declaration.slice(0, index).trim()
    const value = declaration.slice(index + 1).trim()

    if (property !== '' && value !== '') {
      style[camel(property)] = value
    }
  }

  return style
}

const camel = (property: string): string =>
  property.replace(/-([a-z])/g, (_match, letter: string) => letter.toUpperCase())
