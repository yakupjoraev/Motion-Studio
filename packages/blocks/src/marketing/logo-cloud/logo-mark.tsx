import { type Logo, logoAlt } from './logo-cloud.schema'
import { LOGO_BOX, logoImageStyles, logoWordStyles } from './logo-cloud.styles'

export interface LogoMarkProps {
  readonly entry: Logo
  readonly grayscale: boolean
}

/**
 * One mark: the image if there is one, the name set as a word-mark if there is not.
 *
 * The height is capped and the width follows — see `logoImageStyles` for why that is the only
 * normalisation that works on marks a block has never seen.
 */
export function LogoMark({ entry, grayscale }: LogoMarkProps) {
  return (
    <span className={LOGO_BOX}>
      {entry.src === '' ? (
        <span className={logoWordStyles({ grayscale })} data-testid="logo-word">
          {entry.label}
        </span>
      ) : (
        <img
          alt={logoAlt(entry)}
          className={logoImageStyles({ grayscale })}
          data-testid="logo-image"
          decoding="async"
          height={32}
          loading="lazy"
          src={entry.src}
          width={140}
        />
      )}
    </span>
  )
}
