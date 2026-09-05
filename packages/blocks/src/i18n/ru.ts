import type { RegistryCopy } from './registry-copy.types'
import { RU_BLOCKS } from './ru-blocks'
import { RU_HINTS } from './ru-hints'
import { RU_LABELS } from './ru-labels'

/**
 * Slot labels are few enough to sit here rather than in a file of their own: eleven strings, and
 * every one of them is also a control label somewhere in the catalogue.
 */
const RU_SLOTS: Readonly<Record<string, string>> = {
  Cells: 'Ячейки',
  Content: 'Содержимое',
  'Dialog content': 'Содержимое диалога',
  Items: 'Элементы',
  Left: 'Слева',
  Media: 'Медиа',
  Panels: 'Панели',
  Right: 'Справа',
  Signup: 'Подписка',
  Slides: 'Слайды',
  Steps: 'Шаги',
}

export const ruRegistryCopy: RegistryCopy = {
  categories: {
    layout: 'Раскладка',
    hero: 'Герои',
    content: 'Содержимое',
    marketing: 'Маркетинг',
    navigation: 'Навигация',
    interactive: 'Интерактив',
    data: 'Данные',
    forms: 'Формы',
    effects: 'Эффекты',
  },
  blocks: RU_BLOCKS,
  labels: { ...RU_LABELS, ...RU_SLOTS },
  hints: RU_HINTS,
}
