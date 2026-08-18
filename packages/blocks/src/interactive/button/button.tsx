import { LoadingIcon } from '@motion-studio/icons'

import { ControlIcon } from '../control-icon'
import { ICON_SIZE } from '../interactive.styles'

import { BUTTON_SPINNER, buttonStyles } from './button.styles'
import type { ButtonProps } from './button.types'

/**
 * A button a user places on their page.
 *
 * **Deliberately not `packages/ui`'s Button.** That one is studio chrome at 24 px with 11 px text; this one
 * is content that gets exported into someone else's project. The two share the token vocabulary — the same
 * accent, the same hairline, the same focus ring — and nothing else, because sharing the component would
 * mean the export shipped a class list from the editor's own panels. `interactive.styles.ts` states the
 * rest of the reasoning beside the class list itself.
 *
 * An `href` makes it an `<a>` and an empty one makes it a `<button>`: Enter activates a link and Space
 * activates a button, and only the element tells a reader which they have.
 *
 * `loading` is `aria-busy` plus a visually hidden word beside the label, so the state is announced without
 * a live region — which matters because the export is static markup and has no place to put one. It is also
 * `aria-disabled` rather than `disabled`: a disabled element leaves the accessibility tree's focus order, so
 * a screen-reader user tabbing to the control would never hear that it is busy. Guarding the *activation*
 * is the reader's own handler, and the codegen descriptor's notes say so.
 *
 * There is no hover animation in here on purpose: the five presets prompt 40 names live on the `hover`
 * channel and the user selects among them in the inspector — ADR-204.
 */
export function Button({
  label,
  href,
  variant,
  size,
  leadingIcon,
  trailingIcon,
  loading,
  loadingLabel,
  fullWidth,
  hidden,
}: ButtonProps) {
  const className = buttonStyles({ variant, size, fullWidth, hidden })
  const glyph = ICON_SIZE[size]

  const content = (
    <>
      {loading ? (
        <LoadingIcon aria-hidden="true" className={BUTTON_SPINNER} size={glyph} />
      ) : (
        <ControlIcon name={leadingIcon} size={glyph} />
      )}
      {label}
      {loading && <span className="sr-only">{loadingLabel}</span>}
      {!loading && <ControlIcon name={trailingIcon} size={glyph} />}
    </>
  )

  const state = loading ? { 'aria-busy': true, 'aria-disabled': true } : {}

  if (href === '') {
    return (
      <button {...state} className={className} data-testid="button" type="button">
        {content}
      </button>
    )
  }

  return (
    <a {...state} className={className} data-testid="button" href={href}>
      {content}
    </a>
  )
}
