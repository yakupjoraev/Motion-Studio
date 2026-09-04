import { FONT_FAMILY, FONT_WEIGHT, TYPE_SCALE } from '@motion-studio/tokens'
import type { ReactElement } from 'react'

import { Cell, Name, TokenRows, TokenTable } from './token-table'

/**
 * Type: the scale, and the families and weights it is set in. Each component iterates its record, so the tables are the tokens rather
 * than a transcription of them.
 */

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
