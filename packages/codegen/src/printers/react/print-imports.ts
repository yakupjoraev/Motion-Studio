import type { ImportSpec } from '@motion-studio/schema'

import { importRank } from '../../ir/passes/collect-imports'

/**
 * `ImportSpec[]` → the statements at the top of a file. Pass 5 already merged, deduped and sorted them,
 * so the only question left here is where the blank lines go: between the groups it sorted into, which
 * is how every hand-written file in this repository reads.
 */
export function printImport(spec: ImportSpec): string {
  const clause = [
    ...(spec.default === undefined ? [] : [spec.default]),
    ...(spec.named === undefined || spec.named.length === 0
      ? []
      : [`{ ${spec.named.join(', ')} }`]),
  ].join(', ')
  const keyword = spec.typeOnly === true ? 'import type' : 'import'

  return clause === '' ? `import '${spec.from}'` : `${keyword} ${clause} from '${spec.from}'`
}

export function printImports(imports: readonly ImportSpec[]): string {
  const groups: string[][] = []
  let previous: number | undefined

  for (const spec of imports) {
    const rank = importRank(spec.from)

    if (rank !== previous) {
      groups.push([])
      previous = rank
    }

    groups[groups.length - 1]?.push(printImport(spec))
  }

  return groups.map((group) => group.join('\n')).join('\n\n')
}
