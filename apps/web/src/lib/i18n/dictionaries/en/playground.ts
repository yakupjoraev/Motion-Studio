/** The live CSS editor: its panels, its two targets that move, and the four ways out of it. */
export const playground = {
  metaTitle: 'Playground — Motion Studio',
  metaDescription:
    'A live CSS editor for the properties that are hard to write by hand: gradients, shadows, filters, transforms, transitions, clip paths.',
  heading: 'Playground',
  subtitle: 'Eight CSS properties, each with a target built for it.',
  properties: 'Properties',
  presetsAndSharing: 'Presets and sharing',
  cssProperty: 'CSS property',
  presets: 'Presets',
  presetReplaceOrAdd: 'Click to replace, Alt-click to add a layer.',
  presetReplace: 'Click to replace the value.',
  compatibility: 'Compatibility',
  colour: 'Colour',

  compare: 'Compare',
  compareTwoValues: 'Compare two values',
  whichHalf: 'Which half the editor edits',
  swap: 'Swap A and B',

  copyCss: 'Copy CSS',
  copyTailwind: 'Copy as Tailwind',
  copyVariable: 'Copy as CSS variable',
  copyLink: 'Copy link',
  sendToSelection: 'Send to selection',
  /** `{name}` is the block selected in the studio. */
  sendToBlock: 'Send to {name}',
  studioNotListening: 'The studio is not listening. Open it and select a block first.',
  selectOneBlock: 'Select one block in the studio and this sends the value to it.',
  /** Announced after a send: `{property}` landed on the block named `{name}`. */
  sentToBlock: '{property} sent to {name}. Undo in the studio removes it.',
  /** Why a property is refused: the block paints `{property}` itself. */
  blockPaintsItself:
    '{name} does not take {property} from here: it is a property the block paints itself.',
  landsAsChip: 'Lands on {name} as a custom CSS chip.',

  noBezier: 'This value has no cubic-bezier() to drag.',
  addBezier: 'Add one',
  namedCurve: 'Named curve',
  replay: 'Replay',
  reducedMotionDot: 'Reduced motion is on, so the dot holds its end state.',

  pathIsText: 'A path() is edited as text: its commands are not a list of vertices.',
  units: 'Units',
  vertexUnits: 'Vertex units',
  vertex: 'Vertex',
  insertAfter: 'Insert after',
  done: 'Done',

  glassPanel: 'Glass panel',
  behindTheGlass: 'What is behind the glass',
  maskPreview: 'Mask preview',
  cardOnSurface: 'Card on a mid-tone surface',
  cardInPerspective: 'Card in a perspective container',
  toggleState: 'Toggle state',
  loop: 'Loop',
  scrub: 'Scrub',
  transitionProgress: 'Transition progress',

  /** One line per sandbox, saying what its target was built to show — PLAYGROUND.md § Property sandboxes. */
  propertySummaries: {
    background: 'Gradients and layers on a full-bleed rectangle.',
    'box-shadow': 'A card on a mid-tone surface, where a shadow is actually visible.',
    filter: 'A function chain over an image, text and a gradient at once.',
    'backdrop-filter': 'A glass panel over a busy backdrop, which is the only place it reads.',
    'mask-image': 'A checkerboard behind the image, so what the mask removed is visible.',
    'clip-path': 'A grid overlay, so a polygon can be read in percentages.',
    transform: 'A card inside a perspective container, where 3D transforms mean something.',
    transition: 'Two states and a scrub, so the curve is watchable rather than guessed.',
  },
}
