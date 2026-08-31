import type { Tokens } from 'marked'

import { DocsInline } from './docs-inline'

const ALIGN: Readonly<Record<string, string>> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
}

/**
 * The table scrolls inside its own container, never the page — 179 of these carry six columns of
 * prose. The wrapper is focusable for the same reason the code fences are: at 320 px the part past
 * its right edge is otherwise unreachable from a keyboard.
 */
export function DocsTable({
  token,
  ordinal,
}: { readonly token: Tokens.Table; readonly ordinal: number }) {
  return (
    <div
      aria-label={`Table ${ordinal}`}
      className="my-6 overflow-x-auto rounded-lg border border-border focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent-ring"
      // biome-ignore lint/a11y/useSemanticElements: the scroll container wraps the table; it is not the table
      role="region"
      // biome-ignore lint/a11y/noNoninteractiveTabindex: a region that scrolls has to be focusable
      tabIndex={0}
    >
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-border border-b bg-surface-1">
            {token.header.map((cell, index) => (
              <th
                className={`px-3 py-2 font-medium ${ALIGN[token.align[index] ?? 'left'] ?? 'text-left'}`}
                // biome-ignore lint/suspicious/noArrayIndexKey: a table's columns are identified by their position
                key={index}
                scope="col"
              >
                <DocsInline fallback={cell.text} tokens={cell.tokens} />
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {token.rows.map((row, rowIndex) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: a table's rows are identified by their position
            <tr className="border-border-subtle border-b last:border-0" key={rowIndex}>
              {row.map((cell, index) => (
                <td
                  className={`px-3 py-2 align-top text-foreground-muted ${
                    ALIGN[token.align[index] ?? 'left'] ?? 'text-left'
                  }`}
                  // biome-ignore lint/suspicious/noArrayIndexKey: a table's columns are identified by their position
                  key={index}
                >
                  <DocsInline fallback={cell.text} tokens={cell.tokens} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
