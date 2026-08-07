import {
  BLUR,
  DURATION,
  EASING,
  FONT_FAMILY,
  FONT_WEIGHT,
  GRADIENT,
  RADIUS,
  RAMPS,
  SEMANTIC,
  SHADOW,
  SPACE,
  TYPE_SCALE,
  Z_INDEX,
} from '@motion-studio/tokens'
import type { ReactElement } from 'react'

import { Cell, Name, Swatch, TokenRows, TokenTable } from './token-table'

import type { ColorMode, Gradient, GradientPreset } from '@motion-studio/tokens'

/**
 * One component per token group. Each iterates its record, so the tables are the tokens rather than a
 * transcription of them — the property prompt 10 § Constraints asks for.
 */

export function ColorRamps(): ReactElement {
  return (
    <TokenTable caption="Primitive ramps — twelve steps per hue" headings={['Hue', 'Steps']}>
      <TokenRows
        entries={Object.entries(RAMPS)}
        render={(hue, ramp) => (
          <>
            <Name>{hue}</Name>
            <Cell>
              <span className="flex flex-wrap gap-1">
                {Object.entries(ramp).map(([step, value]) => (
                  <span key={step} className="flex flex-col items-center gap-0.5">
                    <Swatch value={value} />
                    <span className="text-[10px] text-foreground-subtle">{step}</span>
                  </span>
                ))}
              </span>
            </Cell>
          </>
        )}
      />
    </TokenTable>
  )
}

export function SemanticColors({ mode }: { mode: ColorMode }): ReactElement {
  return (
    <TokenTable
      caption={`Semantic colours — ${mode}`}
      headings={['Token', 'Swatch', 'Value', 'Variable']}
    >
      <TokenRows
        entries={Object.entries(SEMANTIC[mode])}
        render={(token, value) => (
          <>
            <Name>{token}</Name>
            <Cell>
              <Swatch value={value} />
            </Cell>
            <Cell>{value}</Cell>
            <Name>--ms-color-{token}</Name>
          </>
        )}
      />
    </TokenTable>
  )
}

export function Spacing(): ReactElement {
  return (
    <TokenTable caption="Space — a 4 px base scale" headings={['Token', 'Value', 'Scale']}>
      <TokenRows
        entries={Object.entries(SPACE)}
        render={(token, value) => (
          <>
            <Name>space-{token}</Name>
            <Cell>{value}</Cell>
            <Cell>
              <span className="block h-[8px] rounded-sm bg-accent" style={{ width: value }} />
            </Cell>
          </>
        )}
      />
    </TokenTable>
  )
}

export function Radii(): ReactElement {
  return (
    <TokenTable caption="Radius" headings={['Token', 'Value', 'Shape']}>
      <TokenRows
        entries={Object.entries(RADIUS)}
        render={(token, value) => (
          <>
            <Name>radius-{token}</Name>
            <Cell>{value}px</Cell>
            <Cell>
              <span
                className="block h-[28px] w-[56px] border border-border bg-surface-2"
                style={{ borderRadius: `${value}px` }}
              />
            </Cell>
          </>
        )}
      />
    </TokenTable>
  )
}

export function TypeScale(): ReactElement {
  return (
    <TokenTable caption="Type scale" headings={['Token', 'Size', 'Line height', 'Sample']}>
      <TokenRows
        entries={Object.entries(TYPE_SCALE)}
        render={(token, entry) => (
          <>
            <Name>text-{token}</Name>
            <Cell>{entry.size}</Cell>
            <Cell>{entry.lineHeight}</Cell>
            <Cell>
              <span
                style={{
                  fontSize: entry.size,
                  lineHeight: entry.lineHeight,
                  letterSpacing: entry.tracking,
                }}
              >
                The quick brown fox
              </span>
            </Cell>
          </>
        )}
      />
    </TokenTable>
  )
}

export function Fonts(): ReactElement {
  return (
    <>
      <TokenTable caption="Font families" headings={['Token', 'Stack', 'Sample']}>
        <TokenRows
          entries={Object.entries(FONT_FAMILY)}
          render={(token, stack) => (
            <>
              <Name>font-{token}</Name>
              <Cell>{stack}</Cell>
              <Cell>
                <span style={{ fontFamily: stack }}>Motion Studio</span>
              </Cell>
            </>
          )}
        />
      </TokenTable>
      <TokenTable caption="Font weights" headings={['Token', 'Value', 'Sample']}>
        <TokenRows
          entries={Object.entries(FONT_WEIGHT)}
          render={(token, weight) => (
            <>
              <Name>font-{token}</Name>
              <Cell>{weight}</Cell>
              <Cell>
                <span style={{ fontWeight: weight }}>Motion Studio</span>
              </Cell>
            </>
          )}
        />
      </TokenTable>
    </>
  )
}

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

export function Motion(): ReactElement {
  return (
    <>
      <TokenTable caption="Durations" headings={['Token', 'Value']}>
        <TokenRows
          entries={Object.entries(DURATION)}
          render={(token, value) => (
            <>
              <Name>duration-{token}</Name>
              <Cell>{value} ms</Cell>
            </>
          )}
        />
      </TokenTable>
      <TokenTable caption="Easing curves" headings={['Token', 'Control points', 'Curve']}>
        <TokenRows
          entries={Object.entries(EASING)}
          render={(token, curve) => (
            <>
              <Name>ease-{token}</Name>
              <Cell>cubic-bezier({curve.join(', ')})</Cell>
              <Cell>
                {/* Drawn in the same box the curve editor uses, so the two read alike. */}
                <svg viewBox="0 -50 100 200" className="h-[48px] w-[48px]" role="img">
                  <title>{token} curve</title>
                  <path
                    d={`M 0 100 C ${curve[0] * 100} ${100 - curve[1] * 100}, ${curve[2] * 100} ${100 - curve[3] * 100}, 100 0`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={4}
                  />
                </svg>
              </Cell>
            </>
          )}
        />
      </TokenTable>
    </>
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
