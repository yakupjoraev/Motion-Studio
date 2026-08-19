/**
 * The four ids a wired field needs, derived from one `useId` value.
 *
 * A pure function so the wiring can be tested without rendering, and so every field block derives the same
 * names from the same base — `aria-describedby` pointing at an id nobody generated is the defect this exists
 * to make impossible.
 */
export interface FieldIds {
  readonly labelId: string
  readonly fieldId: string
  readonly hintId: string
  readonly errorId: string
  /**
   * The element holding a custom control's displayed value, for the one field whose control is a `<button>`.
   * `select-field` names its trigger `aria-labelledby="labelId valueId"`, because a self-reference back to the
   * trigger contributes nothing to the computed name — ADR-215 has the measurement.
   */
  readonly valueId: string
  /**
   * Hint first, error second, and **only ids that are in the document**.
   *
   * The error element is always rendered — a `role="alert"` added to the DOM at the same moment as its text is
   * a region most screen readers do not read — so its id is always here. The hint element only exists when
   * there is a hint, so its id is here only then: a dangling `aria-describedby` reference is a description the
   * reader is promised and never given.
   */
  readonly describedBy: string
}

export function fieldIds(base: string, hasHint: boolean): FieldIds {
  const hintId = `${base}-hint`
  const errorId = `${base}-error`

  return {
    labelId: `${base}-label`,
    fieldId: base,
    hintId,
    errorId,
    valueId: `${base}-value`,
    describedBy: hasHint ? `${hintId} ${errorId}` : errorId,
  }
}
