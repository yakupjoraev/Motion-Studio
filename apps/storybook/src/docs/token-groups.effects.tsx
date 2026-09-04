import { BLUR, GRADIENT, SHADOW, Z_INDEX } from '@motion-studio/tokens'
import type { ReactElement } from 'react'

import { Cell, Name, TokenRows, TokenTable } from './token-table'

import type { ColorMode, Gradient, GradientPreset } from '@motion-studio/tokens'

/**
 * Surfaces: elevation, blur, gradients and the z-index order they stack in. Each component iterates its record, so the tables are the tokens rather
 * than a transcription of them.
 */

export function Elevation({ mode }: { mode: ColorMode }): ReactElement {
  const styles = Object.entries(SHADOW)

  return (
    <TokenTable
      caption={`Elevation — one column per style, ${mode} mode`}
      headings={['Level', ...styles.map(([style]) => style)]}
    >
      <TokenRows
        entries={Object.entries(SHADOW.soft[mode])}
        render={(level) => (
          <>
            <Name>shadow-{level}</Name>
            {styles.map(([style, set]) => (
              <Cell key={style}>
                <span
                  className="block h-[32px] w-[56px] rounded-md bg-surface-1"
                  style={{
                    boxShadow: Object.entries(set[mode]).find(([key]) => key === level)?.[1],
                  }}
                />
              </Cell>
            ))}
          </>
        )}
      />
    </TokenTable>
  )
}

/** The same printer `GradientField` uses, kept local so the docs app does not depend on `ui` for it. */
function gradientPreview(gradient: Gradient): string {
  const stops = (list: readonly { color: string; position: number }[]): string =>
    list.map((stop) => `${stop.color} ${stop.position}%`).join(', ')

  if (gradient.kind === 'linear') {
    return `linear-gradient(${gradient.angle}deg, ${stops(gradient.stops)})`
  }

  if (gradient.kind === 'radial') {
    return `radial-gradient(${gradient.shape} at ${gradient.at.x}% ${gradient.at.y}%, ${stops(gradient.stops)})`
  }

  if (gradient.kind === 'conic') {
    return `conic-gradient(from ${gradient.from}deg at ${gradient.at.x}% ${gradient.at.y}%, ${stops(gradient.stops)})`
  }

  return gradient.points
    .map(
      (point) =>
        `radial-gradient(circle ${point.radius}% at ${point.x}% ${point.y}%, ${point.color} 0%, transparent 100%)`,
    )
    .join(', ')
}

export function Effects(): ReactElement {
  return (
    <>
      <TokenTable caption="Blur" headings={['Token', 'Value']}>
        <TokenRows
          entries={Object.entries(BLUR)}
          render={(token, value) => (
            <>
              <Name>blur-{token}</Name>
              <Cell>{value}</Cell>
            </>
          )}
        />
      </TokenTable>
      <TokenTable caption="Gradients" headings={['Preset', 'Kind', 'Readable on', 'Preview']}>
        <TokenRows
          entries={Object.entries<GradientPreset>(GRADIENT)}
          render={(token, preset) => (
            <>
              <Name>{token}</Name>
              <Cell>{preset.gradient.kind}</Cell>
              <Cell>{preset.readable ?? 'needs a scrim'}</Cell>
              <Cell>
                <span
                  className="block h-[32px] w-[96px] rounded-sm border border-border"
                  style={{ backgroundImage: gradientPreview(preset.gradient) }}
                />
              </Cell>
            </>
          )}
        />
      </TokenTable>
      <TokenTable caption="Z index" headings={['Token', 'Value']}>
        <TokenRows
          entries={Object.entries(Z_INDEX)}
          render={(token, value) => (
            <>
              <Name>z-{token}</Name>
              <Cell>{value}</Cell>
            </>
          )}
        />
      </TokenTable>
    </>
  )
}
