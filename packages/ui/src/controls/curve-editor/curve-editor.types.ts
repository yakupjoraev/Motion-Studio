import type { ValueControlProps } from '../control-row/index'

/** `[x1, y1, x2, y2]`, the four numbers CSS `cubic-bezier()` takes, in that order. */
export type CubicBezier = readonly [number, number, number, number]

export type CurveEditorProps = ValueControlProps<CubicBezier>
