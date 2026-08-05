import { AlignBottomIcon } from './align-bottom'
import { AlignCenterHIcon } from './align-center-h'
import { AlignCenterVIcon } from './align-center-v'
import { AlignLeftIcon } from './align-left'
import { AlignRightIcon } from './align-right'
import { AlignTopIcon } from './align-top'
import { BlurIcon } from './blur'
import { BorderIcon } from './border'
import { CardIcon } from './card'
import { CheckIcon } from './check'
import { ChevronDownIcon } from './chevron-down'
import { ChevronLeftIcon } from './chevron-left'
import { ChevronRightIcon } from './chevron-right'
import { ChevronUpIcon } from './chevron-up'
import { CodeIcon } from './code'
import { CopyIcon } from './copy'
import { CursorIcon } from './cursor'
import { CursorFollowIcon } from './cursor-follow'
import { CurveIcon } from './curve'
import { DeleteIcon } from './delete'
import { DistributeHIcon } from './distribute-h'
import { DistributeVIcon } from './distribute-v'
import { DownloadIcon } from './download'
import { DropletIcon } from './droplet'
import { DuplicateIcon } from './duplicate'
import { ErrorIcon } from './error'
import { ExportIcon } from './export'
import { ExternalLinkIcon } from './external-link'
import { EyeIcon } from './eye'
import { EyeOffIcon } from './eye-off'
import { FileIcon } from './file'
import { FolderIcon } from './folder'
import { FooterIcon } from './footer'
import { FormIcon } from './form'
import { GapIcon } from './gap'
import { GradientIcon } from './gradient'
import { GridIcon } from './grid'
import { GroupIcon } from './group'
import { HandIcon } from './hand'
import { HeroIcon } from './hero'
import { HistoryIcon } from './history'
import { ImageIcon } from './image'
import { InfoIcon } from './info'
import { LayoutColumnsIcon } from './layout-columns'
import { LayoutGridIcon } from './layout-grid'
import { LayoutRowsIcon } from './layout-rows'
import { ListIcon } from './list'
import { LoadingIcon } from './loading'
import { LockIcon } from './lock'
import { MarginIcon } from './margin'
import { MinusIcon } from './minus'
import { MoreHorizontalIcon } from './more-horizontal'
import { MoreVerticalIcon } from './more-vertical'
import { MoveIcon } from './move'
import { NavbarIcon } from './navbar'
import { NoiseIcon } from './noise'
import { OpacityIcon } from './opacity'
import { PaddingIcon } from './padding'
import { PaletteIcon } from './palette'
import { PanelLeftIcon } from './panel-left'
import { PanelRightIcon } from './panel-right'
import { PasteIcon } from './paste'
import { PauseIcon } from './pause'
import { PlayIcon } from './play'
import { PlusIcon } from './plus'
import { RadiusIcon } from './radius'
import { RedoIcon } from './redo'
import { ReplayIcon } from './replay'
import { ResizeIcon } from './resize'
import { SaveIcon } from './save'
import { ScissorsIcon } from './scissors'
import { SearchIcon } from './search'
import { SettingsIcon } from './settings'
import { ShadowIcon } from './shadow'
import { SparklesIcon } from './sparkles'
import { SpringIcon } from './spring'
import { SuccessIcon } from './success'
import { TableIcon } from './table'
import { TimelineIcon } from './timeline'
import { TypeIcon } from './type'
import { UndoIcon } from './undo'
import { UngroupIcon } from './ungroup'
import { UnlockIcon } from './unlock'
import { UploadIcon } from './upload'
import { VideoIcon } from './video'
import { WarningIcon } from './warning'
import { WaveIcon } from './wave'
import { XIcon } from './x'
import { ZapIcon } from './zap'

import type { IconComponent } from './icon.types'

/**
 * Name → component, for the callers that look an icon up dynamically: a block definition references an
 * `IconName`, and the icon picker renders the whole set.
 *
 * **The registry imports every icon eagerly**, which prompt 07 decided and this comment records the reason
 * for: each icon is one short path in a small component, its two consumers both live in the studio chunk
 * which already carries every icon, and `registry.test.ts` asserts the set stays under 8 kB gzipped. A lazy
 * map was rejected — 89 dynamic imports means 89 chunks and a request waterfall in the picker.
 *
 * Individual icons stay importable from the barrel, so the landing page and the gallery pull only what they
 * render and never touch this file.
 */
export const ICON_REGISTRY = {
  cursor: CursorIcon,
  hand: HandIcon,
  move: MoveIcon,
  resize: ResizeIcon,
  duplicate: DuplicateIcon,
  delete: DeleteIcon,
  lock: LockIcon,
  unlock: UnlockIcon,
  eye: EyeIcon,
  'eye-off': EyeOffIcon,
  undo: UndoIcon,
  redo: RedoIcon,
  copy: CopyIcon,
  paste: PasteIcon,
  scissors: ScissorsIcon,
  group: GroupIcon,
  ungroup: UngroupIcon,
  'layout-grid': LayoutGridIcon,
  'layout-columns': LayoutColumnsIcon,
  'layout-rows': LayoutRowsIcon,
  'align-left': AlignLeftIcon,
  'align-center-h': AlignCenterHIcon,
  'align-right': AlignRightIcon,
  'align-top': AlignTopIcon,
  'align-center-v': AlignCenterVIcon,
  'align-bottom': AlignBottomIcon,
  'distribute-h': DistributeHIcon,
  'distribute-v': DistributeVIcon,
  padding: PaddingIcon,
  margin: MarginIcon,
  gap: GapIcon,
  palette: PaletteIcon,
  droplet: DropletIcon,
  gradient: GradientIcon,
  blur: BlurIcon,
  shadow: ShadowIcon,
  border: BorderIcon,
  radius: RadiusIcon,
  opacity: OpacityIcon,
  type: TypeIcon,
  sparkles: SparklesIcon,
  noise: NoiseIcon,
  play: PlayIcon,
  pause: PauseIcon,
  replay: ReplayIcon,
  zap: ZapIcon,
  wave: WaveIcon,
  spring: SpringIcon,
  curve: CurveIcon,
  timeline: TimelineIcon,
  'cursor-follow': CursorFollowIcon,
  'chevron-up': ChevronUpIcon,
  'chevron-down': ChevronDownIcon,
  'chevron-left': ChevronLeftIcon,
  'chevron-right': ChevronRightIcon,
  plus: PlusIcon,
  minus: MinusIcon,
  x: XIcon,
  check: CheckIcon,
  search: SearchIcon,
  settings: SettingsIcon,
  'more-horizontal': MoreHorizontalIcon,
  'more-vertical': MoreVerticalIcon,
  'external-link': ExternalLinkIcon,
  'panel-left': PanelLeftIcon,
  'panel-right': PanelRightIcon,
  hero: HeroIcon,
  grid: GridIcon,
  card: CardIcon,
  list: ListIcon,
  table: TableIcon,
  form: FormIcon,
  navbar: NavbarIcon,
  footer: FooterIcon,
  image: ImageIcon,
  video: VideoIcon,
  code: CodeIcon,
  file: FileIcon,
  folder: FolderIcon,
  download: DownloadIcon,
  upload: UploadIcon,
  save: SaveIcon,
  export: ExportIcon,
  history: HistoryIcon,
  info: InfoIcon,
  warning: WarningIcon,
  error: ErrorIcon,
  success: SuccessIcon,
  loading: LoadingIcon,
} as const satisfies Record<string, IconComponent>
