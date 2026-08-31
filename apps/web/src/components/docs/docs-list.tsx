import type { Token, Tokens } from 'marked'

import { DocsCode } from './docs-code'
import { DocsInline } from './docs-inline'
import type { Ordinals } from './docs-ordinals'
import { isCode, isList } from './docs-tokens'

const ITEM_CLASS = 'ms-1 pl-1 leading-relaxed marker:text-foreground-muted'

export interface DocsListProps {
  readonly token: Tokens.List
  readonly ordinals: Ordinals
}

/**
 * Lists nest, and a nested list arrives as a `list` token inside the item's token stream — so an item
 * renders its own blocks rather than only its text. Task items keep their checkbox, disabled: the
 * checklists in `ACCESSIBILITY.md` are a specification, not a form.
 */
export function DocsList({ token, ordinals }: DocsListProps) {
  const Wrapper = token.ordered ? 'ol' : 'ul'

  return (
    <Wrapper
      className={`my-4 flex flex-col gap-2 ${
        token.ordered ? 'list-decimal' : 'list-disc'
      } pl-5 text-foreground-muted`}
      start={typeof token.start === 'number' && token.start !== 1 ? token.start : undefined}
    >
      {token.items.map((item, index) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: a list's items are identified by their position
        <li className={`${ITEM_CLASS} ${item.task ? 'list-none' : ''}`} key={index}>
          {item.task ? (
            <input
              aria-label={item.text}
              checked={item.checked === true}
              className="mr-2 align-[-1px]"
              disabled
              readOnly
              type="checkbox"
            />
          ) : null}
          <ItemBlocks fallback={item.text} ordinals={ordinals} tokens={item.tokens} />
        </li>
      ))}
    </Wrapper>
  )
}

/** An item's children are block tokens: a nested list, a paragraph, or a fenced sample. */
function ItemBlocks({
  tokens,
  fallback,
  ordinals,
}: {
  readonly tokens: readonly Token[] | undefined
  readonly fallback: string
  readonly ordinals: Ordinals
}) {
  if (tokens === undefined) {
    return fallback
  }

  return (
    <>
      {tokens.map((token, index) => {
        const key = `${token.type}-${index}`

        if (isList(token)) {
          return <DocsList key={key} ordinals={ordinals} token={token} />
        }

        if (isCode(token)) {
          return (
            <DocsCode
              info={token.lang}
              key={key}
              ordinal={ordinals.nextCode()}
              source={token.text}
            />
          )
        }

        switch (token.type) {
          case 'space':
            return null
          case 'text':
          case 'paragraph':
            return <DocsInline fallback={token.text} key={key} tokens={token.tokens} />
          default:
            return <DocsInline key={key} tokens={[token]} />
        }
      })}
    </>
  )
}
