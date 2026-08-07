import type { ReactElement, ReactNode } from 'react'

/**
 * The primitives every token table in `tokens.mdx` is drawn from. They take a record and render its
 * entries — none of them names a token, so a token added to `packages/tokens` appears in the docs with
 * no MDX edit. Prompt 10 § Constraints: hand-written token docs go stale within a week.
 */

const CELL = 'border-b border-border px-3 py-2 text-left align-middle'

export interface TokenTableProps {
  readonly caption: string
  readonly headings: readonly string[]
  readonly children: ReactNode
}

export function TokenTable({ caption, headings, children }: TokenTableProps): ReactElement {
  return (
    <table className="w-full border-collapse text-xs">
      <caption className="pb-2 text-left text-foreground-muted text-xs">{caption}</caption>
      <thead>
        <tr>
          {headings.map((heading) => (
            <th key={heading} className={`${CELL} font-medium text-foreground-muted`}>
              {heading}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  )
}

export interface TokenRowsProps<T> {
  /**
   * Entries rather than the record itself. `Object.entries` types an interface's values precisely,
   * where `Record<string, T>` does not accept an interface at all — `SemanticColors` is one, and
   * widening it here would push an `unknown` into every renderer.
   */
  readonly entries: readonly (readonly [string, T])[]
  readonly render: (name: string, value: T) => ReactNode
}

export function TokenRows<T>({ entries, render }: TokenRowsProps<T>): ReactElement {
  return (
    <>
      {entries.map(([name, value]) => (
        <tr key={name}>{render(name, value)}</tr>
      ))}
    </>
  )
}

export function Cell({ children }: { children: ReactNode }): ReactElement {
  return <td className={CELL}>{children}</td>
}

export function Name({ children }: { children: ReactNode }): ReactElement {
  return (
    <td className={`${CELL} font-mono text-foreground`}>
      <code>{children}</code>
    </td>
  )
}

/** A colour chip over the alpha checkerboard, so a translucent token reads as translucent. */
export function Swatch({ value }: { value: string }): ReactElement {
  return (
    <span
      className="inline-block h-[20px] w-[36px] rounded-sm border border-border align-middle"
      style={{ background: value }}
    />
  )
}
