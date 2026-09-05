import type { PluralForms } from '../../plural'

/** The left panel, the inspector, and the canvas's own messages. */
export const studioPanels = {
  panels: 'Panels',
  blocks: 'Blocks',
  layers: 'Layers',
  theme: 'Theme',
  motion: 'Motion',
  effects: 'Effects',

  searchBlocks: 'Search blocks',
  blockCategories: 'Block categories',
  /** The palette card's accessible name: `{name}` the block, `{category}` its category. */
  blockCardLabel: '{name}, {category} block',
  clearSearch: 'Clear search',
  /** `{count}` blocks survive the filter — announced, not only shown. */
  blocksMatch: { one: '{count} block match', other: '{count} blocks match' } as PluralForms,
  noBlocksInCategories: 'No blocks in these categories.',
  /** `{query}` is what was typed into the palette's search. */
  noBlocksMatch: 'No blocks match “{query}”.',
  searchLayers: 'Search layers',
  noLayers: 'No layers match.',
  noEffects: 'No effects are registered.',
  searchPresets: 'Search presets',
  motionChannels: 'Motion channels',
  noPresets: 'No motion presets are registered.',
  presetsMatch: { one: '{count} preset match', other: '{count} presets match' } as PluralForms,
  noPresetsInChannels: 'No presets in these channels.',
  noPresetsMatch: 'No presets match “{query}”.',
  effectsSelectFirst: 'Select a block first',
  /** `{count}` is the cap on how many effects one block may carry. */
  effectsFull: 'This block already carries {count} effects',
  effectsPickTarget: 'Select a block to attach an effect to it.',
  /** `{count}` of `{max}` effect layers are in use on the selected block. */
  effectsUsed: '{count} of {max} layers used on this block.',

  inspectorDocument: 'Document',
  inspectorName: 'Name',
  inspectorCanvasWidth: 'Canvas width',
  inspectorBlocks: 'Blocks',
  inspectorTheme: 'Theme',
  inspectorPreset: 'Preset',
  inspectorOpenTheme: 'Open the theme panel',
  inspectorVersionHistory: 'Version history',
  inspectorSteps: 'Steps',
  inspectorVersionsSoon: 'Saved versions arrive with persistence.',
  /** `{count}` blocks are selected at once. */
  inspectorMulti: {
    one: '{count} block selected. Shared properties only.',
    other: '{count} blocks selected. Shared properties only.',
  } as PluralForms,
  /** `{id}` is the block type the document names. */
  inspectorUnknownBlock: 'No block is registered as “{id}”, so there is nothing to edit.',

  sectionLayout: 'Layout',
  sectionStyle: 'Style',
  sectionTypography: 'Typography',
  sectionMotion: 'Motion',
  sectionEffects: 'Effects',
  sectionCode: 'Code',
  motionSelectOne: 'Select a single block to tune its motion.',
  motionNone: 'No motion. Pick a preset in the Motion panel.',
  codeSoon: '— the generated TSX arrives with the export engine.',

  /** `{breakpoint}` is the one being edited, `{width}` its frame in pixels. */
  responsiveEditing: 'Editing {breakpoint} and up · {width} px and wider',
  responsiveHint: 'You’re editing {breakpoint} and up. Switch to base to change all sizes.',
  dismissHint: 'Dismiss hint',

  /** `{id}` is the missing block type. */
  canvasUnknownBlock: '{name} — no block registered as “{id}”',
  canvasBadProps: '{name} has props it cannot use',

  motionPlay: 'Play',
  motionRemove: 'Remove',
  motionResolve: 'Resolve',
  motionCurve: 'Curve',
  motionEasingCurve: 'Easing curve',
  motionSpring: 'Spring',

  effectsEmpty: 'No effects. Add one from the Effects panel.',
  /** `{count}` layers in the effect stack. */
  effectsLayers: {
    one: '{count} layer. Order is paint order.',
    other: '{count} layers. Order is paint order.',
  } as PluralForms,
  effectsMoveUp: 'Move layer up',
  effectsMoveDown: 'Move layer down',
  effectsRemove: 'Remove',
  effectsEdit: 'Edit',
  effectsLayer: 'Layer',
  effectsBlend: 'Blend',
  effectsBlendMode: 'Blend mode',
  effectsOpacity: 'Opacity',
}
