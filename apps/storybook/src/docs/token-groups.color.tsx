import { RAMPS, SEMANTIC } from '@motion-studio/tokens'
import type { ReactElement } from 'react'

import { Cell, Name, Swatch, TokenRows, TokenTable } from './token-table'

import type { ColorMode } from '@motion-studio/tokens'

/**
 * Colour: the primitive ramps, and the semantic roles that point into them. Each component iterates its record, so the tables are the tokens rather
 * than a transcription of them.
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
