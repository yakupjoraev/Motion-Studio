import type { A11yNotes } from '@motion-studio/schema'

export interface BlockA11yNotesProps {
  readonly a11y: A11yNotes
}

/**
 * What the block does about accessibility, in the block's own words.
 *
 * `prompts/52` asks for notes that are "genuinely useful content, not boilerplate", and the way to
 * get that is not to write them here: `definition.a11y` is written beside each block by whoever made
 * its keyboard path work, and a meta-test in `packages/blocks` keeps it from being empty. A page that
 * generated a sentence per block would produce seventy-two identical sentences and call it
 * documentation.
 */
export function BlockA11yNotes({ a11y }: BlockA11yNotesProps) {
  return (
    <div className="flex flex-col gap-3">
      {a11y.role === undefined ? null : (
        <p className="font-mono text-2xs text-foreground-muted uppercase tracking-[0.14em]">
          Role · <span className="text-foreground">{a11y.role}</span>
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {a11y.notes.map((note) => (
          <li
            className="border-border-subtle border-l-2 pl-3 text-foreground-muted text-sm leading-relaxed"
            key={note}
          >
            {note}
          </li>
        ))}
      </ul>
    </div>
  )
}
