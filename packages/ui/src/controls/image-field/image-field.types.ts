import type { ValueControlProps } from '../control-row/index'

export interface ImageValue {
  /** A URL or a data URL. Empty means no image. */
  readonly src: string
  /** Required by `ACCESSIBILITY.md`; the field warns when it is empty rather than silently allowing it. */
  readonly alt: string
}

export interface ImageFieldProps extends ValueControlProps<ImageValue> {
  /** `COMPONENT_LIBRARY.md` § Control kinds names this prop. `width / height`, e.g. `16 / 9`. */
  readonly aspect?: number | undefined
  /** What the file input accepts. Defaults to the raster and vector formats the export engine emits. */
  readonly accept?: string | undefined
}
