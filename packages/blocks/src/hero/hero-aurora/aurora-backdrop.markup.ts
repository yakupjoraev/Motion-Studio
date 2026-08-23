import { type MarkupElement, el, literal } from '@motion-studio/schema'

import type { AuroraIntensity, AuroraNoise, AuroraPalette } from './hero-aurora.schema'
import {
  AURORA_DRIFTS,
  AURORA_FIELDS,
  AURORA_SCRIM,
  auroraFieldsStyles,
  auroraNoiseStyles,
} from './hero-aurora.styles'

export interface AuroraBackdropMarkupInput {
  readonly palette: AuroraPalette
  readonly intensity: AuroraIntensity
  readonly drift: boolean
  readonly noise: AuroraNoise
}

/** `AuroraBackdrop` as markup: three fields, a scrim and the noise overlay, all decorative. */
export const auroraBackdropMarkup = ({
  palette,
  intensity,
  drift,
  noise,
}: AuroraBackdropMarkupInput): MarkupElement =>
  el('div', {
    classNames: ['pointer-events-none absolute inset-0 z-0'],
    attributes: { 'aria-hidden': literal('true') },
    children: [
      el('div', {
        classNames: [auroraFieldsStyles({ palette, intensity })],
        children: AURORA_FIELDS.map((field, position) =>
          el('div', { classNames: [field, drift ? AURORA_DRIFTS[position] : false] }),
        ),
      }),
      el('div', { classNames: [AURORA_SCRIM] }),
      el('div', { classNames: [auroraNoiseStyles({ noise })] }),
    ],
  })
