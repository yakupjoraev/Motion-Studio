import { DURATION, EASING } from '@motion-studio/tokens'
import type { ReactElement } from 'react'

import { Cell, Name, TokenRows, TokenTable } from './token-table'

/**
 * Motion: durations and easings, each one shown running. Each component iterates its record, so the tables are the tokens rather
 * than a transcription of them.
 */

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
