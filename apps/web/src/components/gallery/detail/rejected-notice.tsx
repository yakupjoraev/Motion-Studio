import { useGallery } from '../../../lib/i18n/surfaces'

export interface RejectedNoticeProps {
  readonly paths: readonly string[]
}

/**
 * What a link with a bad parameter in it says.
 *
 * `prompts/52` § URL-synced state: "Invalid values fall back to defaults with a quiet notice, never a
 * crash." Quiet is the operative word — a visitor arriving from someone else's link did not make this
 * mistake and cannot fix it, so the page names what it ignored and gets on with showing the block.
 */
export function RejectedNotice({ paths }: RejectedNoticeProps) {
  const copy = useGallery().detail

  if (paths.length === 0) {
    return null
  }

  const sentence = paths.length === 1 ? copy.rejectedOne : copy.rejectedMany

  return (
    <p
      className="border-border-subtle border-b px-3 py-2 text-foreground-muted text-xs leading-snug"
      aria-live="polite"
      data-testid="rejected-params"
    >
      {sentence.replace('{paths}', paths.join(', '))}
    </p>
  )
}
