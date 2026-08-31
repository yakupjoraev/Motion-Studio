'use client'

import { ASSET_MODES, type ExportOptions } from '@motion-studio/codegen/options'
import { ControlRow, SegmentedField, SelectField, SwitchField } from '@motion-studio/ui/controls'
import type { ReactNode } from 'react'

export interface OptionsPanelProps {
  /** What the user chose. */
  readonly options: ExportOptions
  /** What the export will do. Where the two disagree the control is fixed, and says why. */
  readonly resolved: ExportOptions
  readonly onChange: (patch: Partial<ExportOptions>) => void
}

const LANGUAGES = [
  { value: 'ts', content: 'TS', label: 'TypeScript' },
  { value: 'js', content: 'JS', label: 'JavaScript' },
]

const IMAGES = [
  { value: 'next-image', content: 'next', label: 'next/image' },
  { value: 'img', content: 'img', label: 'Plain img element' },
]

const ASSETS = ASSET_MODES.map((mode) => ({ value: mode, label: mode }))

/** ADR-237 and ADR-242: the only two fields a target narrows, and the sentence each one earns. */
const FIXED: Readonly<Partial<Record<keyof ExportOptions, string>>> = {
  singleFile: 'HTML is one document',
  imageComponent: 'HTML has no React in it',
}

const TOGGLES = [
  { key: 'includeMotion', label: 'Motion' },
  { key: 'includeTheme', label: 'Theme' },
  { key: 'extractProps', label: 'Extract props' },
  { key: 'singleFile', label: 'Single file' },
  { key: 'format', label: 'Format' },
] as const satisfies readonly { key: keyof ExportOptions; label: string }[]

const asAssetMode = (value: string): ExportOptions['assets'] =>
  ASSET_MODES.find((mode) => mode === value) ?? 'reference'

/**
 * A fixed control is disabled, its reason is visible under the row, and the same sentence reaches the
 * control through `aria-describedby`. A control showing a choice the export quietly ignores would be
 * the dialog lying about its own output.
 */
function Row({
  label,
  fixed,
  children,
}: {
  readonly label: string
  readonly fixed: string | undefined
  readonly children: (slot: {
    readonly id: string
    readonly labelledBy: string
    readonly describedBy: string | undefined
  }) => ReactNode
}) {
  return (
    <div>
      <ControlRow label={label} {...(fixed === undefined ? {} : { description: fixed })}>
        {(slot) => children(slot)}
      </ControlRow>
      {fixed === undefined ? null : (
        <p aria-hidden className="pb-1 pl-5 text-2xs text-foreground-subtle">
          {fixed}
        </p>
      )}
    </div>
  )
}

/** The controls of EXPORT_ENGINE.md § Options, in its order. */
export function OptionsPanel({ options, resolved, onChange }: OptionsPanelProps) {
  const data = resolved.target === 'json' || resolved.target === 'tokens'
  const fixedOf = (key: keyof ExportOptions): string | undefined =>
    resolved[key] === options[key] ? undefined : (FIXED[key] ?? 'Fixed by the target')

  return (
    <div className="flex flex-col">
      <Row fixed={data ? 'The data targets emit no code' : undefined} label="Language">
        {(slot) => (
          <SegmentedField
            {...slot}
            disabled={data}
            label="Language"
            onChange={(value) => onChange({ language: value === 'js' ? 'js' : 'ts' })}
            onCommit={() => undefined}
            options={LANGUAGES}
            value={resolved.language}
          />
        )}
      </Row>

      {TOGGLES.map(({ key, label }) => (
        <Row fixed={fixedOf(key)} key={key} label={label}>
          {(slot) => (
            <SwitchField
              {...slot}
              disabled={fixedOf(key) !== undefined}
              label={label}
              onChange={(value) => onChange({ [key]: value })}
              onCommit={() => undefined}
              value={resolved[key] === true}
            />
          )}
        </Row>
      ))}

      <Row fixed={fixedOf('imageComponent')} label="Images">
        {(slot) => (
          <SegmentedField
            {...slot}
            disabled={fixedOf('imageComponent') !== undefined}
            label="Images"
            onChange={(value) =>
              onChange({ imageComponent: value === 'img' ? 'img' : 'next-image' })
            }
            onCommit={() => undefined}
            options={IMAGES}
            value={resolved.imageComponent}
          />
        )}
      </Row>

      <Row fixed={undefined} label="Assets">
        {(slot) => (
          <SelectField
            {...slot}
            label="Assets"
            onChange={(value) => onChange({ assets: asAssetMode(value) })}
            onCommit={() => undefined}
            options={ASSETS}
            value={resolved.assets}
          />
        )}
      </Row>
    </div>
  )
}
