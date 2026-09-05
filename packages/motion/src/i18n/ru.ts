import type { PresetCopy } from './preset-copy.types'
import { RU_PRESETS } from './ru-presets'

/**
 * The forty-four labels a preset's own controls carry, keyed by their English string.
 *
 * `Scrub` keeps its English: it is what a scroll-driven animation is called in the field, and the
 * two Russian words for it («перемотка», «протяжка») both describe something else — ADR-367 draws
 * the same line for enumeration values.
 */
const RU_LABELS: Readonly<Record<string, string>> = {
  Amount: 'Величина',
  Angle: 'Угол',
  Axis: 'Ось',
  Blur: 'Размытие',
  Caret: 'Курсор ввода',
  Colour: 'Цвет',
  Count: 'Количество',
  Degrees: 'Градусы',
  Delay: 'Задержка',
  Direction: 'Направление',
  Distance: 'Расстояние',
  Duration: 'Длительность',
  Each: 'Шаг между',
  Easing: 'Плавность',
  End: 'Конец',
  Feather: 'Растушёвка',
  From: 'От',
  Glare: 'Блик',
  Intensity: 'Интенсивность',
  Lag: 'Отставание',
  'Max tilt': 'Максимальный наклон',
  Offset: 'Смещение',
  Opacity: 'Прозрачность',
  Origin: 'Точка отсчёта',
  'Pause on hover': 'Пауза при наведении',
  Period: 'Период',
  Perspective: 'Перспектива',
  Radius: 'Радиус',
  Scale: 'Масштаб',
  'Scale step': 'Шаг масштаба',
  Scrub: 'Scrub',
  Shadow: 'Тень',
  Size: 'Размер',
  Snap: 'Привязка',
  Speed: 'Скорость',
  'Split by': 'Делить по',
  Spread: 'Разброс',
  Spring: 'Пружина',
  Stagger: 'Каскад',
  Start: 'Начало',
  Strength: 'Сила',
  Thickness: 'Толщина',
  To: 'До',
  Width: 'Ширина',
}

export const ruPresetCopy: PresetCopy = {
  presets: RU_PRESETS,
  channels: {
    entrance: 'Появление',
    scroll: 'Прокрутка',
    hover: 'Наведение',
    // The document's channel list has one no preset uses yet; the type asks for it all the same.
    press: 'Нажатие',
    cursor: 'Курсор',
    continuous: 'Постоянные',
    exit: 'Уход',
  },
  labels: RU_LABELS,
}
