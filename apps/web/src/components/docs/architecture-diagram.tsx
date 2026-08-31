interface Node {
  readonly id: string
  readonly label: string
  readonly note?: string
  readonly x: number
  readonly y: number
  readonly width: number
  readonly tone?: 'accent' | 'aside'
}

const ROW = 76
const HEIGHT = 32
const TOP = 12

const COL = 170
const GAP = 25
const A = 0
const B = COL + GAP
const C = (COL + GAP) * 2
const SPAN = COL * 2 + GAP

const row = (index: number): number => TOP + ROW * index

/**
 * The ASCII graph's own layout, transcribed: leaves at the top, the only deployable at the bottom.
 * The width is 560 so the picture fits the prose column on a desktop and only scrolls where it has
 * to — at 320 px.
 */
const NODES: readonly Node[] = [
  { id: 'config', label: 'config', note: 'dev-only', x: C, y: row(0), width: COL, tone: 'aside' },
  { id: 'utils', label: 'utils', x: A, y: row(1), width: COL },
  { id: 'tokens', label: 'tokens', x: B, y: row(1), width: COL },
  { id: 'icons', label: 'icons', x: C, y: row(1), width: COL },
  { id: 'schema', label: 'schema', x: A, y: row(2), width: SPAN },
  { id: 'theme', label: 'theme', x: C, y: row(2), width: COL },
  { id: 'motion', label: 'motion', x: A, y: row(3), width: SPAN },
  { id: 'hooks', label: 'hooks', x: C, y: row(3), width: COL },
  { id: 'ui', label: 'ui', x: A, y: row(4), width: SPAN },
  { id: 'editor', label: 'editor', x: C, y: row(4), width: COL },
  { id: 'blocks', label: 'blocks', x: A, y: row(5), width: COL },
  { id: 'canvas', label: 'canvas', x: B, y: row(5), width: COL },
  { id: 'dnd', label: 'dnd', x: C, y: row(5), width: COL },
  { id: 'codegen', label: 'codegen', x: B, y: row(6), width: COL },
  { id: 'web', label: 'apps/web', x: B - GAP, y: row(7), width: SPAN, tone: 'accent' },
]

/** Consumer → dependency, exactly the arrows the ASCII draws. */
const EDGES: readonly (readonly [string, string])[] = [
  ['schema', 'utils'],
  ['schema', 'tokens'],
  ['theme', 'icons'],
  ['motion', 'schema'],
  ['motion', 'theme'],
  ['hooks', 'theme'],
  ['ui', 'motion'],
  ['ui', 'hooks'],
  ['editor', 'hooks'],
  ['blocks', 'ui'],
  ['canvas', 'editor'],
  ['codegen', 'canvas'],
  ['web', 'blocks'],
  ['web', 'codegen'],
  ['web', 'dnd'],
]

const WIDTH = COL * 3 + GAP * 2
const TOTAL = row(7) + HEIGHT + TOP

const byId = new Map(NODES.map((node) => [node.id, node]))

const centre = (node: Node): number => node.x + node.width / 2

/** An orthogonal three-segment path: up out of the consumer, across, down into the dependency. */
function edgePath(from: Node, to: Node): string {
  const startX = centre(from)
  const startY = from.y
  const endX = centre(to)
  const endY = to.y + HEIGHT
  const middle = (startY + endY) / 2

  return startX === endX
    ? `M ${startX} ${startY} L ${endX} ${endY}`
    : `M ${startX} ${startY} L ${startX} ${middle} L ${endX} ${middle} L ${endX} ${endY}`
}

const FILL: Readonly<Record<string, string>> = {
  accent: 'var(--ms-color-accent-muted)',
  aside: 'var(--ms-color-surface-1)',
}

const STROKE: Readonly<Record<string, string>> = {
  accent: 'var(--ms-color-accent)',
  aside: 'var(--ms-color-border-subtle)',
}

/**
 * `ARCHITECTURE.md` § Dependency graph, as SVG rather than as box-drawing characters. Prompt 53
 * rejects Mermaid on a measurable requirement rather than on taste: its colours are computed, while
 * every stroke here resolves through a `--ms-color-*` variable, so both colour modes are the theme's
 * own and the docs-content test asserts the picture carries no literal colour at all.
 *
 * The picture is `aria-hidden`; the list under it is what a screen reader reads. A spatial
 * description of fifteen boxes helps nobody, and the graph's content is "who depends on whom".
 */
export function ArchitectureDiagram() {
  return (
    <figure className="my-8 flex flex-col gap-3">
      {/* The scroll container is the focusable region, and the list inside it is what a reader who
          lands there hears — a scrollable box with no keyboard access is the defect ADR-298 found. */}
      <div
        aria-label="Dependency graph"
        className="overflow-x-auto rounded-lg border border-border bg-surface-1 p-4 focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-accent-ring"
        // biome-ignore lint/a11y/useSemanticElements: a <section> here would wrap the figure's caption as well
        role="region"
        // biome-ignore lint/a11y/noNoninteractiveTabindex: the diagram scrolls sideways at 320 px
        tabIndex={0}
      >
        <svg
          aria-hidden
          className="block"
          height={TOTAL}
          role="presentation"
          style={{ minWidth: WIDTH }}
          viewBox={`0 0 ${WIDTH} ${TOTAL}`}
          width={WIDTH}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <marker
              id="ms-arrow"
              markerHeight="6"
              markerWidth="6"
              orient="auto-start-reverse"
              refX="5"
              refY="3"
            >
              <path d="M 0 0 L 6 3 L 0 6 z" fill="var(--ms-color-border-strong)" />
            </marker>
          </defs>

          {EDGES.map(([from, to]) => {
            const source = byId.get(from)
            const target = byId.get(to)

            return source === undefined || target === undefined ? null : (
              <path
                d={edgePath(source, target)}
                fill="none"
                key={`${from}-${to}`}
                markerEnd="url(#ms-arrow)"
                stroke="var(--ms-color-border-strong)"
                strokeWidth="1"
              />
            )
          })}

          {NODES.map((node) => (
            <g key={node.id}>
              <rect
                fill={node.tone === undefined ? 'var(--ms-color-surface-2)' : FILL[node.tone]}
                height={HEIGHT}
                rx="6"
                stroke={node.tone === undefined ? 'var(--ms-color-border)' : STROKE[node.tone]}
                width={node.width}
                x={node.x}
                y={node.y}
              />
              <text
                fill="var(--ms-color-foreground)"
                fontFamily="var(--ms-font-mono)"
                fontSize="12"
                x={node.x + 12}
                y={node.y + 21}
              >
                {node.label}
              </text>
              {node.note === undefined ? null : (
                <text
                  fill="var(--ms-color-foreground-muted)"
                  fontFamily="var(--ms-font-mono)"
                  fontSize="10"
                  textAnchor="end"
                  x={node.x + node.width - 12}
                  y={node.y + 21}
                >
                  {node.note}
                </text>
              )}
            </g>
          ))}
        </svg>

        <div className="sr-only">
          <h3>The dependency graph as a list</h3>
          <p>
            Fifteen packages in seven layers. A package may depend on the layers below it and never
            on the ones above.
          </p>
          <ul>
            {NODES.map((node) => {
              const dependencies = EDGES.filter(([from]) => from === node.id).map(([, to]) => to)

              return (
                <li key={node.id}>
                  {node.label}
                  {dependencies.length === 0
                    ? ' depends on nothing in this graph'
                    : ` depends on ${dependencies.join(', ')}`}
                </li>
              )
            })}
          </ul>
        </div>
      </div>

      <figcaption className="text-foreground-muted text-sm">
        Arrows point from a consumer to what it depends on. Read bottom-up:{' '}
        <code className="font-mono">apps/web</code> is the only deployable, and nothing points back
        into it. <code className="font-mono">editor</code> also depends on{' '}
        <code className="font-mono">schema</code> and <code className="font-mono">utils</code>,
        which the graph states here rather than drawing.
      </figcaption>
    </figure>
  )
}

/**
 * The one fence this replaces: the dependency graph in `ARCHITECTURE.md`. Matched on the two box
 * corners plus the only deployable's name, and `docs-content.test.tsx` asserts it matches exactly one
 * fence in the whole corpus — so a second ASCII graph arriving does not silently become this picture.
 */
export const isDependencyGraphFence = (source: string): boolean =>
  source.includes('apps/web') && source.includes('┌') && source.includes('schema')
