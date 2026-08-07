interface EyeDropperResult {
  readonly sRGBHex: string
}

interface EyeDropperInstance {
  open(): Promise<EyeDropperResult>
}

type EyeDropperConstructor = new () => EyeDropperInstance

interface WindowWithEyeDropper {
  readonly EyeDropper?: EyeDropperConstructor
}

/**
 * `EyeDropper` is Chromium-only and not in `lib.dom` yet, so the shape is declared here rather than
 * asserted at the call site. § ColorPicker: hidden where it does not exist, never a broken button.
 */
export function eyeDropperSupported(): boolean {
  return (window as Window & WindowWithEyeDropper).EyeDropper !== undefined
}

/** The picked colour as sRGB hex, or `null` when the user dismissed the picker. */
export async function pickScreenColor(): Promise<string | null> {
  const EyeDropperApi = (window as Window & WindowWithEyeDropper).EyeDropper

  if (EyeDropperApi === undefined) {
    return null
  }

  // A dismissed picker rejects. That is the one outcome this function exists to absorb.
  return new EyeDropperApi()
    .open()
    .then((result) => result.sRGBHex)
    .catch(() => null)
}
