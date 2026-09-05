import type { Dictionary } from '../../dictionary'

export const gallery: Dictionary['gallery'] = {
  metaTitle: 'Блоки — Motion Studio',
  metaDescription:
    'Семьдесят два готовых компонента, и каждый работает прямо на этой странице. Откройте любой, поменяйте пропсы и заберите React, который он печатает.',
  eyebrow: 'Каталог',
  heading: 'Все блоки, вживую.',
  intro:
    'Это не страница скриншотов. Каждая карточка ниже — сам компонент, отрисованный тем же реестром, из которого берёт редактор. Откройте любой, поменяйте пропсы и скопируйте исходник, который он печатает.',
  searchLabel: 'Поиск по каталогу',
  searchPlaceholder: 'Искать среди 72 блоков по имени, тегу или описанию',
  blockCount: {
    one: '{count} блок',
    few: '{count} блока',
    many: '{count} блоков',
    other: '{count} блока',
  },
  blockCountFiltered: {
    one: '{count} из {total} блоков',
    few: '{count} из {total} блоков',
    many: '{count} из {total} блоков',
    other: '{count} из {total} блоков',
  },

  detail: {
    breadcrumb: '← Все блоки',
    notFoundTitle: 'Не найдено — Motion Studio',
    propsHeading: 'Пропсы',
    propsRegion: 'Пропсы',
    propsEmpty: 'У этого блока нет пропсов.',
    propColumn: 'Проп',
    typeColumn: 'Тип',
    defaultColumn: 'По умолчанию',
    descriptionColumn: 'Описание',
    responsiveTitle: 'Можно задать на каждом брейкпоинте',
    accessibilityHeading: 'Доступность',
    role: 'Роль',
    sourceHeading: 'Код, который он печатает',
    copyReact: 'Скопировать React',
    copied: 'Скопировано',
    copyAnnouncement: 'Исходник компонента скопирован в буфер обмена',
    copyFailed: 'Браузер не дал доступ к буферу обмена',
    exporterFallback:
      'Экспортёр не загрузился, поэтому здесь исходник для значений блока по умолчанию.',
    lineCount: {
      one: '{count} строка · react',
      few: '{count} строки · react',
      many: '{count} строк · react',
      other: '{count} строки · react',
    },
    propsPanel: 'пропсы',
    reset: 'Сбросить',
    previewTheme: 'Тема превью',
    previewWidth: 'Ширина превью',
    rejectedOne:
      'Ссылка задала {paths} значение, которое блок не принимает. Показано значение по умолчанию.',
    rejectedMany:
      'Ссылка задала {paths} значения, которых блок не принимает. Показаны значения по умолчанию.',
  },
}
