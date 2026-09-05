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

  /*
   * The six sections the inspector renders for every block. A block-defined group's heading is not
   * here: it comes from the block's own metadata and is translated through the registry's table
   * (ADR-365), which holds only strings the registry declares.
   */
  sectionLayout: 'Layout',
  sectionStyle: 'Style',
  sectionTypography: 'Typography',
  sectionMotion: 'Motion',
  sectionEffects: 'Effects',
  sectionCode: 'Code',
  motionSelectOne: 'Select a single block to tune its motion.',
  motionNone: 'No motion. Pick a preset in the Motion panel.',
  codeNothingSelected: 'Nothing selected.',
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
  /** `{channel}` is the assigned channel — entrance, hover, scroll. */
  motionReplayChannel: 'Replay {channel}',
  motionRemoveChannel: 'Remove {channel} motion',
  /** `{id}` is the preset the document names and the catalogue does not have. */
  motionUnknownPreset: 'Unknown preset “{id}”',
  /** `{channel}` is the channel the selected block has no target for. */
  motionChannelUnsupported: 'This block does not support the {channel} channel',

  effectsEmpty: 'No effects. Add one from the Effects panel.',
  effectsNoneOnSelection: 'No effects on this selection.',
  /** `{count}` effects spread over a selection of more than one block. */
  effectsAcrossSelection: {
    one: '{count} effect across the selection. Select one block to edit its stack.',
    other: '{count} effects across the selection. Select one block to edit its stack.',
  } as PluralForms,
  /**
   * `{count}` of the `{max}` layers a block may carry. Not a plural pair: the noun agrees with the
   * cap, which never changes, so both languages read correctly at every count.
   */
  effectsLayers: '{count} of {max} layers. Order is paint order.',
  effectsMoveUp: 'Move layer up',
  effectsMoveDown: 'Move layer down',
  effectsRemove: 'Remove',
  /** `{name}` is the effect, `{property}` the declaration a playground value wrote. */
  effectsRemoveNamed: 'Remove {name}',
  effectsRemoveCustom: 'Remove the custom {property}',
  effectsEdit: 'Edit',
  effectsLayer: 'Layer',
  effectsBehind: 'Behind content',
  effectsInFront: 'In front',
  effectsBlend: 'Blend',
  effectsBlendMode: 'Blend mode',
  effectsOpacity: 'Opacity',
}
