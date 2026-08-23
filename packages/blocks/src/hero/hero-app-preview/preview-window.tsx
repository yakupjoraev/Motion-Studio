import {
  PLACEHOLDER_BAR,
  PLACEHOLDER_BODY,
  PLACEHOLDER_CANVAS,
  PLACEHOLDER_DOT,
  PLACEHOLDER_NODE,
  PLACEHOLDER_ROW,
  PLACEHOLDER_SIDEBAR,
  SIDEBAR_ROWS,
} from './hero-app-preview.styles'

/**
 * What the plate shows before a screenshot exists. Not a placeholder in the apologetic sense — it is
 * the block's default state, and a hero whose default state is a grey rectangle would fail the premise
 * the whole category is testing. Furniture, so the whole thing is hidden from assistive technology.
 */
export function PreviewWindow() {
  return (
    <div aria-hidden="true" data-testid="hero-preview-placeholder">
      <div className={PLACEHOLDER_BAR}>
        <span className={PLACEHOLDER_DOT} />
        <span className={PLACEHOLDER_DOT} />
        <span className={PLACEHOLDER_DOT} />
      </div>
      <div className={PLACEHOLDER_BODY}>
        <div className={PLACEHOLDER_SIDEBAR}>
          {SIDEBAR_ROWS.map((width) => (
            <span className={`${PLACEHOLDER_ROW} ${width}`} key={width} />
          ))}
        </div>
        <div className={PLACEHOLDER_CANVAS}>
          <span className={PLACEHOLDER_NODE} />
        </div>
      </div>
    </div>
  )
}
