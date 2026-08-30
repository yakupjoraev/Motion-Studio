import type { PropRow } from '@motion-studio/schema'

export interface BlockPropsTableProps {
  readonly rows: readonly PropRow[]
}

/**
 * The block's props, read off its Zod schema at build time — `describeProps` in `packages/schema`
 * does the reading, because that is the package that owns both the schema and Zod.
 *
 * A real `<table>` with a real header row, because it is one: a screen reader that announces "Prop,
 * blur, Type, number 24…160" has said what a sighted reader sees, and a grid of divs cannot.
 */
export function BlockPropsTable({ rows }: BlockPropsTableProps) {
  if (rows.length === 0) {
    return <p className="text-foreground-muted text-sm">This block takes no props.</p>
  }

  /*
   * A focusable labelled region, for the reason ADR-298 gives about the landing page's code block:
   * at 320 px this table scrolls sideways, nothing inside it is focusable, and the last two columns
   * are unreachable from a keyboard. The ring is drawn inside the box because the border is rounded
   * and the overflow is clipped.
   */
  return (
    <div
      aria-label="Props"
      className="overflow-x-auto rounded-xl border border-border focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent-ring"
      data-testid="props-table"
      // biome-ignore lint/a11y/useSemanticElements: the semantic element would wrap the table in a <section>, which is a landmark this page does not want a fifth of
      role="region"
      // biome-ignore lint/a11y/noNoninteractiveTabindex: a region that scrolls has to be focusable, or the last two columns are unreachable at 320 px
      tabIndex={0}
    >
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="border-border-subtle border-b bg-surface-1">
            <Th>Prop</Th>
            <Th>Type</Th>
            <Th>Default</Th>
            <Th>Description</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr className="border-border-subtle border-b last:border-b-0" key={row.name}>
              <td className="px-4 py-2.5 align-top font-mono text-xs">
                {row.name}
                {row.responsive ? (
                  <span
                    className="ml-2 rounded-full border border-border-subtle px-1.5 py-0.5 text-2xs text-foreground-muted uppercase tracking-[0.1em]"
                    title="Can be set per breakpoint"
                  >
                    bp
                  </span>
                ) : null}
              </td>
              <td className="px-4 py-2.5 align-top font-mono text-foreground-muted text-xs">
                {row.type}
              </td>
              <td className="px-4 py-2.5 align-top font-mono text-foreground-muted text-xs tabular-nums">
                {row.defaultValue}
              </td>
              <td className="px-4 py-2.5 align-top text-foreground-muted text-xs leading-snug">
                {row.description}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function Th({ children }: { readonly children: string }) {
  return (
    <th
      className="px-4 py-2.5 font-mono text-2xs text-foreground-muted uppercase tracking-[0.14em]"
      scope="col"
    >
      {children}
    </th>
  )
}
