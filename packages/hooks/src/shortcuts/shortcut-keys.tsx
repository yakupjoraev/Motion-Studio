import { formatKeyParts } from './format-keys'
import { type Platform, currentPlatform } from './normalize-keys'

/**
 * One `<kbd>` per key. The parts carry the platform's own glyphs, so this component never decides
 * what a modifier is called — it only decides that keys look like keys.
 */
export function ShortcutKeys({
  keys,
  platform = currentPlatform(),
}: {
  readonly keys: string
  readonly platform?: Platform
}) {
  const parts = formatKeyParts(keys, platform)

  return (
    <span className="flex shrink-0 items-center gap-0.5" data-testid="shortcut-keys">
      {parts.map((part, index) => (
        <kbd
          className="min-w-5 rounded-xs border border-border bg-surface-2 px-1 text-center font-medium text-[11px] text-foreground-muted leading-5"
          // biome-ignore lint/suspicious/noArrayIndexKey: the parts of one binding are positional and may repeat, so the index is what identifies them
          key={`${part}-${index}`}
        >
          {part}
        </kbd>
      ))}
    </span>
  )
}
