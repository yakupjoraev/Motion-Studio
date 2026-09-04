import { RADIUS, SPACE } from '@motion-studio/tokens'
import type { ReactElement } from 'react'

import { Cell, Name, TokenRows, TokenTable } from './token-table'

/**
 * The two spatial scales — space, and the radii that follow the shapes it makes. Each component iterates its record, so the tables are the tokens rather
 * than a transcription of them.
 */

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
