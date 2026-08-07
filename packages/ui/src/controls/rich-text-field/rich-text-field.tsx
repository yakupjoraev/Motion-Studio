import { ExternalLinkIcon, TypeIcon } from '@motion-studio/icons'
import { cn } from '@motion-studio/utils'
import { type ClipboardEvent, type ReactElement, memo, useEffect, useRef, useState } from 'react'

import { Button } from '../../button/index'
import { Input } from '../../input/index'
import { Popover } from '../../popover/index'
import { controlLabelProps } from '../control-row/index'
import { hrefIssue } from '../link-field/index'
import { plainText, sanitizeRichText } from './rich-text'

import type { RichTextFieldProps } from './rich-text-field.types'

/**
 * `execCommand` is deprecated and is still the only formatting API that operates on the user's live
 * selection. The alternative is a selection-and-range editor of our own, which is a project rather than a
 * control. It is feature-detected, so a browser that has dropped it renders a field that still types.
 */
const exec = (command: string, argument?: string): void => {
  if (typeof document.execCommand === 'function') {
    document.execCommand(command, false, argument)
  }
}

function RichTextFieldImpl({
  value,
  onChange,
  onCommit,
  label,
  labelledBy,
  describedBy,
  id,
  disabled = false,
  mixed = false,
  placeholder,
  className,
}: RichTextFieldProps): ReactElement {
  const editorRef = useRef<HTMLDivElement>(null)
  /** What this field last produced, so a value coming back in does not reset the caret. */
  const emitted = useRef<string | null>(null)
  const [href, setHref] = useState('')

  useEffect(() => {
    const editor = editorRef.current
    const incoming = mixed ? '' : value

    if (editor !== null && incoming !== emitted.current) {
      editor.innerHTML = incoming
      emitted.current = incoming
    }
  }, [value, mixed])

  const emit = (commit: boolean): void => {
    const html = sanitizeRichText(editorRef.current?.innerHTML ?? '')

    emitted.current = html
    onChange(html)

    if (commit) {
      onCommit(html)
    }
  }

  const onPaste = (event: ClipboardEvent<HTMLDivElement>): void => {
    // Restricted paste: the text arrives, its formatting does not.
    event.preventDefault()
    const clipboard = event.clipboardData

    exec('insertText', plainText(clipboard.getData('text/html')) || clipboard.getData('text/plain'))
    emit(false)
  }

  const format = (command: string): void => {
    editorRef.current?.focus()
    exec(command)
    emit(true)
  }

  return (
    <div className={cn('flex min-w-0 flex-1 flex-col gap-1', className)}>
      <span className="flex items-center gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          aria-label="Bold"
          disabled={disabled}
          onClick={() => format('bold')}
        >
          <span className="font-bold text-2xs">B</span>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Italic"
          disabled={disabled}
          onClick={() => format('italic')}
        >
          <span className="text-2xs italic">I</span>
        </Button>
        <Popover
          label="Link"
          trigger={
            <Button variant="ghost" size="icon" aria-label="Link" disabled={disabled}>
              <ExternalLinkIcon size={12} />
            </Button>
          }
        >
          <span className="flex w-[220px] items-center gap-1">
            <Input
              aria-label="Link URL"
              placeholder="https://"
              value={href}
              invalid={href !== '' && hrefIssue(href) !== null}
              className="min-w-0 flex-1"
              onChange={(event) => setHref(event.target.value)}
            />
            <Button
              size="sm"
              disabled={hrefIssue(href) !== null}
              onClick={() => {
                editorRef.current?.focus()
                exec('createLink', href)
                emit(true)
                setHref('')
              }}
            >
              Apply
            </Button>
          </span>
        </Popover>
        <TypeIcon size={12} className="ml-1 text-foreground-subtle" aria-hidden />
      </span>

      {/* An `input` cannot hold inline formatting, which is the whole point of this control. */}
      <div
        ref={editorRef}
        id={id}
        role="textbox"
        tabIndex={disabled ? -1 : 0}
        aria-multiline="false"
        aria-describedby={describedBy}
        aria-disabled={disabled || undefined}
        data-placeholder={mixed ? 'Mixed' : placeholder}
        contentEditable={!disabled}
        suppressContentEditableWarning
        className={cn(
          'min-h-[26px] rounded-sm border border-border-strong bg-surface-2 px-2 py-1 text-xs',
          'outline-none focus-visible:shadow-focus',
          'empty:before:text-foreground-subtle empty:before:content-[attr(data-placeholder)]',
          disabled && 'pointer-events-none opacity-50',
        )}
        onInput={() => emit(false)}
        onBlur={() => emit(true)}
        onPaste={onPaste}
        {...controlLabelProps(label, labelledBy)}
      />
    </div>
  )
}

export const RichTextField = memo(RichTextFieldImpl)
