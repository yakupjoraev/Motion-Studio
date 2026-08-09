import type { ControlDescriptor } from '@motion-studio/schema'
import type { ReactElement, ReactNode } from 'react'

import { ControlRow } from '../control-row/index'
import { ListField } from '../list-field/index'

import { asList, asString } from './coerce'
import type { ControlRendererProps } from './control-renderer.types'
import { optionNumber, optionString } from './descriptor-options'

type Item = Readonly<Record<string, unknown>>

const itemControls = (descriptor: ControlDescriptor): readonly ControlDescriptor[] => {
  const raw = descriptor.options?.['itemControls']

  return Array.isArray(raw) ? (raw as ControlDescriptor[]) : []
}

const template = (descriptor: ControlDescriptor): Item => {
  const raw = descriptor.options?.['itemTemplate']

  return typeof raw === 'object' && raw !== null ? (raw as Item) : {}
}

export interface ListControlProps extends ControlRendererProps {
  /** The renderer itself, passed in: an item's controls are the same switch, one level down. */
  readonly renderControl: (props: ControlRendererProps) => ReactNode
}

/**
 * `list` is the one kind whose value is a shape the descriptor describes rather than holds. Item
 * controls are `ControlDescriptor`s with a single-key path into the item, so a list of plans is
 * built from the same metadata as everything else — COMPONENT_LIBRARY.md § Control kinds.
 */
export function ListControl({
  descriptor,
  value,
  onChange,
  onCommit,
  slot,
  disabled,
  mixed,
  renderControl,
}: ListControlProps): ReactElement {
  const items = asList(value)
  const labelKey = optionString(descriptor, 'labelKey') ?? 'label'

  const write = (next: readonly Item[], commit: boolean): void => {
    if (commit) {
      onCommit(next)

      return
    }

    onChange(next)
  }

  return (
    <ListField
      createItem={() => ({ ...template(descriptor) })}
      itemLabel={(item, index) => asString(item[labelKey]) || `Item ${index + 1}`}
      onChange={(next) => write(next as readonly Item[], false)}
      onCommit={(next) => write(next as readonly Item[], true)}
      renderItem={(item, _index, edit) =>
        itemControls(descriptor).map((one) => (
          <ControlRow key={one.path} label={one.label}>
            {(inner) =>
              renderControl({
                descriptor: one,
                value: item[one.path],
                onChange: (next) => edit({ ...item, [one.path]: next }, false),
                onCommit: (next) => edit({ ...item, [one.path]: next }, true),
                slot: inner,
              })
            }
          </ControlRow>
        ))
      }
      value={items}
      {...(optionNumber(descriptor, 'max') === undefined
        ? {}
        : { max: optionNumber(descriptor, 'max') })}
      {...(descriptor.options?.['sortable'] === false ? { sortable: false } : {})}
      {...(slot ?? {})}
      label={descriptor.label}
      {...(disabled === undefined ? {} : { disabled })}
      {...(mixed === undefined ? {} : { mixed })}
    />
  )
}
