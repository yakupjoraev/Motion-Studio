export interface ControlLabelProps {
  readonly 'aria-label'?: string
  readonly 'aria-labelledby'?: string
}

/**
 * One accessible name, never two. A control hosted by `ControlRow` is named by the row's `<label>`;
 * a control used on its own names itself. Emitting both would let them drift apart silently.
 */
export function controlLabelProps(label: string, labelledBy?: string): ControlLabelProps {
  return labelledBy === undefined ? { 'aria-label': label } : { 'aria-labelledby': labelledBy }
}
