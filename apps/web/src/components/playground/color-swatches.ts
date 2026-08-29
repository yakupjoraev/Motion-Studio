import { type Extension, RangeSetBuilder, StateEffect, StateField } from '@codemirror/state'
import {
  Decoration,
  type DecorationSet,
  type EditorView,
  ViewPlugin,
  type ViewUpdate,
  WidgetType,
} from '@codemirror/view'

/**
 * The inline colour swatches — PLAYGROUND.md § Editor. A colour in a value is a thing you look at, and
 * a hex triplet is not a thing you can look at; the square beside it is.
 *
 * Clicking one reports the range and the text to the caller, which opens the picker. The extension
 * itself paints and reports and does nothing else: a picker mounted inside a CodeMirror widget would be
 * a second React root inside the editor's DOM.
 */
export interface ColorHit {
  readonly from: number
  readonly to: number
  readonly value: string
  /** Viewport coordinates of the swatch, so the picker can open where the reader clicked. */
  readonly x: number
  readonly y: number
}

/** `oklch(…)`, `rgb(…)`, `hsl(…)`, `color-mix(…)` and hex. Every colour form the presets use. */
const COLOR = /#[0-9a-f]{3,8}\b|\b(?:oklch|oklab|rgba?|hsla?|hwb|lab|lch|color-mix)\([^()]*\)/gi

class SwatchWidget extends WidgetType {
  constructor(
    private readonly color: string,
    private readonly from: number,
    private readonly to: number,
  ) {
    super()
  }

  override eq(other: SwatchWidget): boolean {
    return other.color === this.color && other.from === this.from
  }

  override toDOM(view: EditorView): HTMLElement {
    const swatch = document.createElement('button')

    swatch.type = 'button'
    swatch.className = 'ms-color-swatch'
    swatch.style.backgroundColor = this.color
    swatch.setAttribute('aria-label', `Edit ${this.color}`)
    swatch.addEventListener('mousedown', (event) => {
      event.preventDefault()

      const box = swatch.getBoundingClientRect()

      view.dispatch({
        effects: colorClicked.of({
          from: this.from,
          to: this.to,
          value: this.color,
          x: box.left,
          y: box.bottom,
        }),
      })
    })

    return swatch
  }

  override ignoreEvent(): boolean {
    return false
  }
}

/** The click, as a transaction effect: the editor's own channel, so nothing has to reach around it. */
export const colorClicked = StateEffect.define<ColorHit>()

function swatches(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>()

  for (const { from, to } of view.visibleRanges) {
    const text = view.state.doc.sliceString(from, to)

    COLOR.lastIndex = 0

    let match = COLOR.exec(text)

    while (match !== null) {
      const start = from + match.index
      const end = start + match[0].length

      builder.add(
        start,
        start,
        Decoration.widget({ widget: new SwatchWidget(match[0], start, end), side: -1 }),
      )

      match = COLOR.exec(text)
    }
  }

  return builder.finish()
}

const swatchPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet

    constructor(view: EditorView) {
      this.decorations = swatches(view)
    }

    update(update: ViewUpdate): void {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = swatches(update.view)
      }
    }
  },
  { decorations: (value) => value.decorations },
)

/**
 * The last click, kept in state so React can read it in an update listener. A field rather than a
 * callback prop: the effect arrives inside a transaction, and state is where a transaction's result
 * belongs.
 */
export const colorHitField = StateField.define<ColorHit | undefined>({
  create: () => undefined,
  update(current, transaction) {
    for (const effect of transaction.effects) {
      if (effect.is(colorClicked)) {
        return effect.value
      }
    }

    return transaction.docChanged ? undefined : current
  },
})

export const colorSwatches: Extension = [colorHitField, swatchPlugin]
