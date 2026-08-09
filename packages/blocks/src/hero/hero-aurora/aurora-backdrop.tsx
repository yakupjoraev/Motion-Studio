import type { AuroraIntensity, AuroraNoise, AuroraPalette } from './hero-aurora.schema'
import {
  AURORA_DRIFTS,
  AURORA_FIELDS,
  AURORA_SCRIM,
  auroraFieldsStyles,
  auroraNoiseStyles,
} from './hero-aurora.styles'

export interface AuroraBackdropProps {
  readonly palette: AuroraPalette
  readonly intensity: AuroraIntensity
  readonly drift: boolean
  readonly noise: AuroraNoise
}

/**
 * The backdrop: three drifting fields, a scrim, and a noise overlay.
 *
 * The whole thing is `aria-hidden` and empty. It is rendered *after* the copy in DOM order and sits
 * behind by z-index rather than by paint order, so nothing here can become the largest contentful
 * paint — and a `radial-gradient` could not be one anyway (ADR-120).
 */
export function AuroraBackdrop({ palette, intensity, drift, noise }: AuroraBackdropProps) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0"
      data-testid="hero-aurora-backdrop"
    >
      <div className={auroraFieldsStyles({ palette, intensity })}>
        {AURORA_FIELDS.map((field, position) => (
          <div
            className={drift ? `${field} ${AURORA_DRIFTS[position]}` : field}
            data-testid="aurora-field"
            key={field}
          />
        ))}
      </div>

      <div className={AURORA_SCRIM} />
      <div className={auroraNoiseStyles({ noise })} data-testid="aurora-noise" />
    </div>
  )
}
