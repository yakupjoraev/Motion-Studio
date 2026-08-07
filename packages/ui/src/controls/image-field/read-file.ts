/**
 * A picked file as a data URL. The studio has no upload endpoint — `PRODUCT.md` keeps documents local —
 * so an uploaded image travels inside the document, which is what `FileReader` produces here.
 *
 * `null` on a read error rather than a throw: the caller's response is the same either way, and a
 * rejected promise at a file input turns into an unhandled rejection at the first careless call site.
 */
export function readAsDataUrl(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = () => {
      resolve(typeof reader.result === 'string' ? reader.result : null)
    }
    reader.onerror = () => {
      resolve(null)
    }
    reader.readAsDataURL(file)
  })
}
