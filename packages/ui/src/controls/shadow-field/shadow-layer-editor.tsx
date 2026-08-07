import type { ReactElement } from 'react'

import { ColorField } from '../color-field/index'
import { ScrubField } from '../scrub-field/index'
import { SwitchField } from '../switch-field/index'

import type { ColorTokenPreset } from '../color-picker/index'
import type { ShadowLayer } from './shadow-field.types'

export interface ShadowLayerEditorProps {
  readonly layer: ShadowLayer
  readonly index: number
  readonly disabled: boolean
  readonly tokens: readonly ColorTokenPreset[] | undefined
  readonly onEdit: (layer: ShadowLayer, commit: boolean) => void
}

const LENGTHS = [
  { key: 'x', label: 'X', min: undefined },
  { key: 'y', label: 'Y', min: undefined },
  { key: 'blur', label: 'blur', min: 0 },
  { key: 'spread', label: 'spread', min: undefined },
] as const

/** The one layer under edit. Every length is a scrub field, as § Control rows requires of any number. */
export function ShadowLayerEditor({
  layer,
  index,
  disabled,
  tokens,
  onEdit,
}: ShadowLayerEditorProps): ReactElement {
  const position = index + 1

  return (
    <div className="flex flex-col gap-1 rounded-sm bg-surface-2 p-1">
      <span className="flex items-center gap-1">
        {LENGTHS.map((length) => (
          <ScrubField
            key={length.key}
            label={`Shadow ${position} ${length.label}`}
            value={layer[length.key]}
            min={length.min}
            unit="px"
            disabled={disabled}
            className="min-w-0 flex-1"
            onChange={(next) => onEdit({ ...layer, [length.key]: next }, false)}
            onCommit={(next) => onEdit({ ...layer, [length.key]: next }, true)}
          />
        ))}
      </span>

      <span className="flex items-center gap-2">
        <ColorField
          label={`Shadow ${position} colour`}
          value={{ kind: 'color', color: layer.color }}
          tokens={tokens}
          alpha
          disabled={disabled}
          onChange={(next) =>
            onEdit({ ...layer, color: next.kind === 'color' ? next.color : layer.color }, false)
          }
          onCommit={(next) =>
            onEdit({ ...layer, color: next.kind === 'color' ? next.color : layer.color }, true)
          }
        />
        <SwitchField
          label={`Shadow ${position} inset`}
          hint="inset"
          value={layer.inset}
          disabled={disabled}
          onChange={(inset) => onEdit({ ...layer, inset }, false)}
          onCommit={(inset) => onEdit({ ...layer, inset }, true)}
        />
      </span>
    </div>
  )
}
