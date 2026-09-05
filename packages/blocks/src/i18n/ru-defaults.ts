import type { UnknownProps } from '@motion-studio/schema'

/**
 * The text a block is inserted with, in Russian — ADR-364. The schema keeps its English defaults and
 * this is applied over them at insert time, so a saved document holds strings rather than a language
 * setting, and switching the interface never rewrites somebody's page.
 *
 * A patch replaces a whole array rather than a row: a row is one object, and a partial one would not
 * survive the block's own schema. `registry-copy.test.ts` checks every key against the block it
 * names, so a renamed prop fails here rather than silently ceasing to apply.
 *
 * Two blocks have no entry on purpose. `image` carries only a `sizes` media query, and
 * `code-block`'s defaults are a code sample and its filename — code says the same thing in every
 * language.
 */
export const RU_DEFAULTS: Readonly<Record<string, UnknownProps>> = {
  'hero-centered': {
    eyebrow: 'Сейчас в открытой бете',
    headline: 'Проектируйте интерфейсы, которые уже умеют двигаться',
    subtitle:
      'Визуальный редактор для React, который отдаёт тот самый компонент, что вы выкатили, — вместе с токенами и движением.',
    actions: [
      {
        label: 'Начать',
        href: '#',
        variant: 'primary',
      },
      {
        label: 'Посмотреть галерею',
        href: '#',
        variant: 'secondary',
      },
    ],
    trust: [
      {
        label: 'Лицензия MIT',
      },
      {
        label: 'Без регистрации',
      },
      {
        label: 'Отдаёт настоящий код',
      },
    ],
  },
  'hero-split': {
    eyebrow: 'Визуальное редактирование',
    headline: 'Каждое свойство — в одной панели, без догадок',
    subtitle:
      'Поставьте блок, настройте его в инспекторе и прочитайте исходник, который получится, ещё до того, как согласитесь на него.',
    actions: [
      {
        label: 'Открыть студию',
        href: '#',
        variant: 'primary',
      },
      {
        label: 'Читать документацию',
        href: '#',
        variant: 'secondary',
      },
    ],
  },
  'hero-aurora': {
    eyebrow: 'Motion Studio',
    headline: 'Соберите то, что вы всё время набрасываете',
    subtitle:
      'Бесконечный канвас, настоящий реестр компонентов и экспорт, который читается как написанный руками.',
    actions: [
      {
        label: 'Начать',
        href: '#',
        variant: 'primary',
      },
      {
        label: 'Посмотреть тур',
        href: '#',
        variant: 'secondary',
      },
    ],
    trust: [
      {
        label: 'Открытый код',
      },
      {
        label: 'Корректен к reduced motion',
      },
      {
        label: 'Отдаёт чистый CSS',
      },
    ],
  },
  'hero-video': {
    eyebrow: 'Посмотрите в деле',
    headline: 'Девяносто секунд от пустого канваса до готовой страницы',
    subtitle: 'Никаких слайдов. Весь путь, одним дублем.',
    actions: [
      {
        label: 'Открыть студию',
        href: '#',
        variant: 'primary',
      },
      {
        label: 'Читать документацию',
        href: '#',
        variant: 'ghost',
      },
    ],
  },
  'hero-terminal': {
    eyebrow: 'Для инженеров',
    headline: 'Всё заканчивается пул-реквестом, а не скриншотом',
    subtitle:
      'Экспорт прямо в репозиторий, который у вас уже есть, — одна команда и диф, который команда может отревьюить.',
    actions: [
      {
        label: 'Поставить CLI',
        href: '#',
        variant: 'primary',
      },
      {
        label: 'Документация по экспорту',
        href: '#',
        variant: 'secondary',
      },
    ],
    title: 'motion-studio — export',
    lines: [
      {
        text: 'npx motion-studio export --target next',
        kind: 'prompt',
      },
      {
        text: 'Reading document … 24 nodes, 3 breakpoints',
        kind: 'output',
      },
      {
        text: 'Wrote 12 components · 4 routes · 1 theme',
        kind: 'output',
      },
      {
        text: 'tsc --noEmit … 0 errors',
        kind: 'output',
      },
      {
        text: 'Done in 1.8s',
        kind: 'output',
      },
    ],
  },
  'hero-app-preview': {
    eyebrow: 'Студия',
    headline: 'Редактор — это и есть продукт, а не его демонстрация',
    subtitle:
      'Канвас, инспектор, слои и экспорт в одном окне — том самом, в котором собрана эта страница.',
    actions: [
      {
        label: 'Открыть студию',
        href: '#',
        variant: 'primary',
      },
      {
        label: 'Посмотреть галерею',
        href: '#',
        variant: 'secondary',
      },
    ],
  },
  heading: {
    text: 'Заголовок',
  },
  text: {
    text: 'Абзац — это то, что читатель и правда читает целиком. Держите в нём одну мысль, не выходите за читаемую длину строки, и страница будет выглядеть так, будто её кто-то задумал.',
  },
  quote: {
    quote:
      'Он отдаёт тот компонент, который я написала бы сама, — а это единственная проверка, которая важна.',
    author: 'Priya Raman',
    role: 'Ведущий инженер, Northwind',
  },
  stat: {
    label: 'Медианное время экспорта',
  },
  badge: {
    label: 'Новое',
  },
  'feature-grid': {
    eyebrow: 'Что вы получаете',
    heading: 'Всё, что нужно лендингу, уже собрано',
    description:
      'Двенадцать маркетинговых блоков, и каждый — настоящий компонент со схемой, контролами и экспортом.',
    items: [
      {
        icon: 'zap',
        title: 'Настоящие компоненты',
        body: 'Каждый блок — продакшен-компонент React, а не его картинка.',
      },
      {
        icon: 'curve',
        title: 'Движение, которое настраивается',
        body: 'Пятьдесят один пресет, шесть каналов и редактор кривой, который рисует пружину.',
      },
      {
        icon: 'export',
        title: 'Экспорт, который компилируется',
        body: 'React, Next или чистый HTML — типизированный, отформатированный и ваш.',
      },
      {
        icon: 'palette',
        title: 'Темы, которые доезжают',
        body: 'Один контрол переводит документ из резкого в мягкий, из светлого в тёмный.',
      },
      {
        icon: 'radius',
        title: 'Адаптивность из коробки',
        body: 'Шесть брейкпоинтов и переопределения, которые показывают, откуда взялись.',
      },
      {
        icon: 'success',
        title: 'Доступность сразу',
        body: 'Клавиатура, кольца фокуса и reduced motion — не отдельный этап потом.',
      },
    ],
  },
  'feature-split': {
    heading: 'Две половины, по одному решению за раз',
    rows: [
      {
        eyebrow: 'Канвас',
        title: 'Правьте настоящий компонент, а не его макет',
        body: 'Поставили блок — и смотрите на компонент, который поедет в прод. Пропсы типизированы, движение живое, а экспорт — то же дерево, которое вы только что собрали.',
        media: {
          src: '',
          alt: '',
          width: 1600,
          height: 1000,
          sizes: '(min-width: 1024px) 50vw, 100vw',
        },
        reversed: false,
      },
      {
        eyebrow: 'Движение',
        title: 'Тайминги, которые чувствуешь до релиза',
        body: 'Пятьдесят один пресет в шести каналах, пружина, которую инспектор рисует интегрированием, и одна политика reduced motion на всех.',
        media: {
          src: '',
          alt: '',
          width: 1600,
          height: 1000,
          sizes: '(min-width: 1024px) 50vw, 100vw',
        },
        reversed: false,
      },
    ],
  },
  'bento-grid': {
    heading: 'Всё в одном экране',
  },
  'pricing-table': {
    eyebrow: 'Цены',
    heading: 'Одна цена, все блоки',
    description:
      'Годовая подписка — два месяца в подарок. Менять план или уходить можно когда угодно.',
    plans: [
      {
        name: 'Бесплатный',
        description: 'Всё, чтобы попробовать по-настоящему.',
        priceMonthly: '0',
        priceYearly: '0',
        badge: '',
        ctaLabel: 'Начать бесплатно',
        ctaHref: '#',
        features: [
          {
            label: 'Три документа',
            included: true,
          },
          {
            label: 'Весь реестр блоков',
            included: true,
          },
          {
            label: 'Экспорт в React и HTML',
            included: true,
          },
          {
            label: 'Свои темы',
            included: false,
          },
          {
            label: 'Командные библиотеки',
            included: false,
          },
        ],
      },
      {
        name: 'Студия',
        description: 'Для работы, которая идёт в прод.',
        priceMonthly: '19',
        priceYearly: '190',
        badge: 'Чаще всего берут',
        ctaLabel: 'Взять «Студию»',
        ctaHref: '#',
        features: [
          {
            label: 'Документы без ограничений',
            included: true,
          },
          {
            label: 'Весь реестр блоков',
            included: true,
          },
          {
            label: 'Все цели экспорта',
            included: true,
          },
          {
            label: 'Свои темы',
            included: true,
          },
          {
            label: 'Командные библиотеки',
            included: false,
          },
        ],
      },
      {
        name: 'Команда',
        description: 'Общие библиотеки и ревью.',
        priceMonthly: '49',
        priceYearly: '490',
        badge: '',
        ctaLabel: 'Написать нам',
        ctaHref: '#',
        features: [
          {
            label: 'Документы без ограничений',
            included: true,
          },
          {
            label: 'Весь реестр блоков',
            included: true,
          },
          {
            label: 'Все цели экспорта',
            included: true,
          },
          {
            label: 'Свои темы',
            included: true,
          },
          {
            label: 'Командные библиотеки',
            included: true,
          },
        ],
      },
    ],
  },
  'testimonial-card': {
    quote:
      'Он отдаёт тот компонент, который я написала бы руками, — а это единственная проверка, которая важна.',
    author: 'Priya Raman',
    role: 'Ведущий инженер',
    company: 'Northwind',
  },
  'testimonial-marquee': {
    eyebrow: 'Отзывы',
    heading: 'Что с ним делают',
    items: [
      {
        quote: 'Экспорт — это тот компонент, который я написала бы руками.',
        author: 'Priya Raman',
        role: 'Ведущий инженер',
        company: 'Northwind',
        avatar: '',
      },
      {
        quote: 'Движение теперь выкатывают дизайнеры. Раньше это была задача в трекере.',
        author: 'Tomas Lind',
        role: 'Ведущий дизайнер',
        company: 'Kestrel',
        avatar: '',
      },
      {
        quote: 'Reduced motion работает везде — я проверила, потому что он не работает нигде.',
        author: 'Amara Osei',
        role: 'Инженер по доступности',
        company: 'Vellum',
        avatar: '',
      },
      {
        quote: 'Шесть брейкпоинтов, и я вижу, какое значение откуда пришло.',
        author: 'Jonas Weber',
        role: 'Ведущий фронтендер',
        company: 'Halden',
        avatar: '',
      },
      {
        quote: 'Это инструмент, а не демо. Редкость.',
        author: 'Mei Chen',
        role: 'Продуктовый дизайнер',
        company: 'Lantern',
        avatar: '',
      },
      {
        quote: 'Одна только таблица тарифов сэкономила нам неделю борьбы с CMS.',
        author: 'Rosa Delgado',
        role: 'Маркетинговый инженер',
        company: 'Corvid',
        avatar: '',
      },
    ],
  },
  'logo-cloud': {
    heading: 'Команды, которые уже на нём',
    logos: [
      {
        label: 'Northwind',
        src: '',
        alt: '',
      },
      {
        label: 'Kestrel',
        src: '',
        alt: '',
      },
      {
        label: 'Vellum',
        src: '',
        alt: '',
      },
      {
        label: 'Halden',
        src: '',
        alt: '',
      },
      {
        label: 'Lantern',
        src: '',
        alt: '',
      },
      {
        label: 'Corvid',
        src: '',
        alt: '',
      },
    ],
  },
  'cta-banner': {
    heading: 'Соберите страницу, оставьте себе код',
    description: 'Каждый блок отдаётся тем компонентом, который вы написали бы руками.',
    actions: [
      {
        label: 'Начать',
        href: '#',
        variant: 'primary',
      },
      {
        label: 'Читать документацию',
        href: '#',
        variant: 'secondary',
      },
    ],
  },
  'cta-split': {
    eyebrow: 'Начало',
    heading: 'Начните с бесплатного плана',
    description: 'Три документа, весь реестр и все цели экспорта. Без карты.',
    actions: [
      {
        label: 'Начать',
        href: '#',
        variant: 'primary',
      },
      {
        label: 'Читать документацию',
        href: '#',
        variant: 'secondary',
      },
    ],
    label: 'Электронная почта',
    placeholder: 'you@company.com',
    submitLabel: 'Подписаться',
    invalidMessage: 'Введите адрес в виде you@company.com.',
    successMessage: 'Проверьте почту и подтвердите подписку.',
    errorMessage: 'Не отправилось. Попробуйте ещё раз через минуту.',
    note: 'Одно письмо в месяц. Отписка в один клик.',
  },
  'faq-accordion': {
    heading: 'О чём спрашивают первым делом',
    items: [
      {
        question: 'Экспорт правда компилируется?',
        answer:
          'Да. Каждый блок — типизированный компонент React, и экспорт отдаёт то же дерево с импортами, классами и движением. Никакого нашего рантайма в результате нет.',
      },
      {
        question: 'Что станет с анимациями за пределами студии?',
        answer:
          'Они поедут с вами. Пресет отдаётся вариантами и переходом — либо блоком keyframes для тех, что живут на CSS, — и обработка reduced motion едет вместе с ним.',
      },
      {
        question: 'Можно ли использовать свои дизайн-токены?',
        answer:
          'Движок тем и есть слой токенов. Отдайте их как CSS-переменные, конфиг Tailwind или JSON — блоки прочитают их где угодно.',
      },
      {
        question: 'Насколько он доступен?',
        answer:
          'Клавиатура, управление фокусом и reduced motion — это гейты сборки, а не этап на потом. У каждого блока есть свои заметки по доступности.',
      },
    ],
  },
  'comparison-table': {
    heading: 'Как он выглядит на фоне других',
    columns: [
      {
        label: 'Motion Studio',
        highlighted: true,
      },
      {
        label: 'Дизайн-инструмент',
        highlighted: false,
      },
      {
        label: 'Конструктор страниц',
        highlighted: false,
      },
    ],
    rows: [
      {
        label: 'Отдаёт настоящие компоненты',
        values: ['yes', 'no', 'no'],
      },
      {
        label: 'Пресеты движения',
        values: ['51', 'Руками', 'Пара штук'],
      },
      {
        label: 'Уважает reduced motion',
        values: ['yes', 'no', 'no'],
      },
      {
        label: 'Забирает вашу разметку себе',
        values: ['no', 'no', 'yes'],
      },
      {
        label: 'Работает в браузере',
        values: ['yes', 'no', 'yes'],
      },
      {
        label: 'Типизированные пропсы',
        values: ['yes', 'no', 'no'],
      },
    ],
    regionLabel: 'Сравнение возможностей',
  },
  'newsletter-form': {
    heading: 'Заметки о релизах, раз в месяц',
    description: 'Что изменилось, что сломалось и чему мы научились. Без цепочек писем.',
    label: 'Электронная почта',
    placeholder: 'you@company.com',
    submitLabel: 'Подписаться',
    invalidMessage: 'Введите адрес в виде you@company.com.',
    successMessage: 'Проверьте почту и подтвердите подписку.',
    errorMessage: 'Не отправилось. Попробуйте ещё раз через минуту.',
    note: 'Одно письмо в месяц. Отписка в один клик.',
  },
  navbar: {
    brandLabel: 'Motion Studio',
    links: [
      {
        label: 'Продукт',
        href: '#product',
        children: [],
      },
      {
        label: 'Документация',
        href: '',
        children: [
          {
            label: 'Начало работы',
            href: '#start',
            description: 'Установить, открыть студию, поставить блок.',
          },
          {
            label: 'Блоки',
            href: '#blocks',
            description: 'Реестр, проп за пропом.',
          },
          {
            label: 'Экспорт',
            href: '#export',
            description: 'React, Next, HTML и что отдаёт каждый.',
          },
        ],
      },
      {
        label: 'Цены',
        href: '#pricing',
        children: [],
      },
      {
        label: 'Изменения',
        href: '#changelog',
        children: [],
      },
    ],
    actions: [
      {
        label: 'Войти',
        href: '#signin',
        variant: 'ghost',
      },
      {
        label: 'Начать',
        href: '#start',
        variant: 'primary',
      },
    ],
    skipLinkTarget: '#main',
    ariaLabel: 'Основная',
  },
  'navbar-floating': {
    brandLabel: 'Motion Studio',
    links: [
      {
        label: 'Продукт',
        href: '#product',
      },
      {
        label: 'Документация',
        href: '#docs',
      },
      {
        label: 'Цены',
        href: '#pricing',
      },
    ],
    actions: [
      {
        label: 'Начать',
        href: '#start',
        variant: 'primary',
      },
    ],
    ariaLabel: 'Основная',
  },
  'sidebar-nav': {
    groups: [
      {
        title: 'Начало работы',
        collapsible: false,
        items: [
          {
            label: 'Обзор',
            href: '#overview',
            icon: 'file',
          },
          {
            label: 'Установка',
            href: '#install',
            icon: 'download',
          },
          {
            label: 'Первый документ',
            href: '#first',
            icon: 'hero',
          },
        ],
      },
      {
        title: 'Блоки',
        collapsible: true,
        items: [
          {
            label: 'Реестр',
            href: '#registry',
            icon: 'grid',
          },
          {
            label: 'Раскладка',
            href: '#layout',
            icon: 'layout-rows',
          },
          {
            label: 'Маркетинг',
            href: '#marketing',
            icon: 'card',
          },
          {
            label: 'Навигация',
            href: '#navigation',
            icon: 'navbar',
          },
        ],
      },
      {
        title: 'Экспорт',
        collapsible: true,
        items: [
          {
            label: 'React',
            href: '#react',
            icon: 'code',
          },
          {
            label: 'Next',
            href: '#next',
            icon: 'file',
          },
          {
            label: 'HTML',
            href: '#html',
            icon: 'export',
          },
        ],
      },
    ],
    ariaLabel: 'Документация',
  },
  footer: {
    brandLabel: 'Motion Studio',
    tagline: 'Визуальный редактор современных интерфейсов на React. Продукт — это экспорт.',
    columns: [
      {
        title: 'Продукт',
        links: [
          {
            label: 'Студия',
            href: '#studio',
          },
          {
            label: 'Блоки',
            href: '#blocks',
          },
          {
            label: 'Экспорт',
            href: '#export',
          },
          {
            label: 'Изменения',
            href: '#changelog',
          },
        ],
      },
      {
        title: 'Документация',
        links: [
          {
            label: 'Начало работы',
            href: '#start',
          },
          {
            label: 'Движение',
            href: '#motion',
          },
          {
            label: 'Темы',
            href: '#theming',
          },
        ],
      },
      {
        title: 'Компания',
        links: [
          {
            label: 'О нас',
            href: '#about',
          },
          {
            label: 'Контакты',
            href: '#contact',
          },
        ],
      },
    ],
    socials: [
      {
        network: 'GitHub',
        href: '#github',
        icon: 'code',
      },
      {
        network: 'YouTube',
        href: '#youtube',
        icon: 'video',
      },
    ],
    legal: [
      {
        label: 'Приватность',
        href: '#privacy',
      },
      {
        label: 'Условия',
        href: '#terms',
      },
    ],
    copyright: '© Motion Studio',
    ariaLabel: 'Подвал',
  },
  breadcrumbs: {
    items: [
      {
        label: 'Документация',
        href: '#docs',
      },
      {
        label: 'Блоки',
        href: '#blocks',
      },
      {
        label: 'Навигация',
        href: '#navigation',
      },
      {
        label: 'Хлебные крошки',
        href: '#breadcrumbs',
      },
    ],
    ariaLabel: 'Хлебные крошки',
  },
  dock: {
    items: [
      {
        label: 'Канвас',
        href: '#canvas',
        icon: 'hero',
      },
      {
        label: 'Блоки',
        href: '#blocks',
        icon: 'grid',
      },
      {
        label: 'Слои',
        href: '#layers',
        icon: 'layout-rows',
      },
      {
        label: 'Движение',
        href: '#motion',
        icon: 'timeline',
      },
      {
        label: 'Тема',
        href: '#theme',
        icon: 'palette',
      },
      {
        label: 'Экспорт',
        href: '#export',
        icon: 'export',
      },
    ],
    ariaLabel: 'Быстрые действия',
  },
  button: {
    label: 'Начать',
    loadingLabel: 'Загрузка',
  },
  'button-group': {
    items: [
      {
        label: 'Помесячно',
        icon: '',
      },
      {
        label: 'Годовой',
        icon: '',
      },
    ],
    ariaLabel: 'Вид',
  },
  tabs: {
    items: [
      {
        label: 'Обзор',
        icon: '',
        body: 'Визуальный редактор интерфейсов на React: бесконечный канвас, реестр продакшен-блоков и генератор кода, который отдаёт то, что вы видите.',
      },
      {
        label: 'Движение',
        icon: '',
        body: 'Пресеты по каналам — появление, наведение, прокрутка, уход — которые складываются, а не наслаиваются, и каждый уважает reduced motion.',
      },
      {
        label: 'Экспорт',
        icon: '',
        body: 'React, Next или чистый HTML — с классами Tailwind и без следов редактора в разметке.',
      },
      {
        label: 'Токены',
        icon: '',
        body: 'Одна тема задаёт цвет, радиусы, отступы, тени и движение, и экспорт увозит те же переменные.',
      },
    ],
    ariaLabel: 'Разделы',
  },
  accordion: {
    items: [
      {
        label: 'Что такое канвас',
        icon: '',
        body: 'Бесконечный артборд с настоящими блоками: зум, панорама, привязки и направляющие, и каждый узел — тот компонент, которым он и экспортируется.',
      },
      {
        label: 'Как хранится движение',
        icon: '',
        body: 'Узел держит по одной спецификации на канал — id пресета, триггер и параметры, — так что анимация становится данными, которые правит инспектор, а не кодом, спрятанным в блоке.',
      },
      {
        label: 'Что попадает в экспорт',
        icon: '',
        body: 'То же дерево, с классами Tailwind, вынесенными вариантами и без следов редактора в разметке.',
      },
    ],
    ariaLabel: 'Подробности',
  },
  carousel: {
    slides: [
      {
        label: 'Канвас',
        icon: 'grid',
        body: 'Бесконечный артборд с настоящими компонентами, на любом зуме.',
      },
      {
        label: 'Инспектор',
        icon: 'settings',
        body: 'Генерируется из схемы самого блока, поэтому новый проп — это новый контрол.',
      },
      {
        label: 'Движение',
        icon: 'zap',
        body: 'Пресеты по каналам, которые складываются, а не наслаиваются, и корректны к reduced motion.',
      },
      {
        label: 'Экспорт',
        icon: 'export',
        body: 'React, Next или чистый HTML — то же дерево, с классами Tailwind.',
      },
    ],
    ariaLabel: 'Главное',
  },
  'modal-trigger': {
    triggerLabel: 'Открыть диалог',
    title: 'Пригласите команду',
    description: 'Им придёт письмо со ссылкой, которая живёт семь дней.',
    body: 'Положите сюда форму, список или что угодно ещё.',
    closeLabel: 'Закрыть',
  },
  'tooltip-target': {
    label: 'Опубликовать',
    content: 'Все, у кого есть ссылка, увидят текущую версию.',
  },
  'command-menu-preview': {
    placeholder: 'Поиск команд…',
    commands: [
      {
        label: 'Вставить блок',
        icon: 'plus',
        hint: 'B',
        group: 'Редактор',
      },
      {
        label: 'Показать слои',
        icon: 'layout-rows',
        hint: '⌥L',
        group: 'Редактор',
      },
      {
        label: 'Проиграть движение',
        icon: 'play',
        hint: 'Space',
        group: 'Движение',
      },
      {
        label: 'Править кривую',
        icon: 'curve',
        hint: '',
        group: 'Движение',
      },
      {
        label: 'Экспортировать проект',
        icon: 'export',
        hint: '⌘E',
        group: 'Проект',
      },
      {
        label: 'Конструктор тем',
        icon: 'palette',
        hint: '⌘T',
        group: 'Проект',
      },
    ],
    alt: 'Командная палитра со списком команд редактора, движения и проекта и их сочетаниями клавиш.',
  },
  'theme-toggle': {
    lightLabel: 'Светлая',
    darkLabel: 'Тёмная',
    systemLabel: 'Система',
    ariaLabel: 'Цветовой режим',
  },
  table: {
    caption: 'Экспорты за последние семь дней',
    columns: [
      {
        label: 'Документ',
        align: 'start',
        sortable: true,
      },
      {
        label: 'Цель',
        align: 'start',
        sortable: true,
      },
      {
        label: 'Узлов',
        align: 'end',
        sortable: true,
      },
      {
        label: 'Длительность',
        align: 'end',
        sortable: true,
      },
      {
        label: 'Результат',
        align: 'start',
        sortable: false,
      },
    ],
    emptyMessage: 'Экспортов пока нет.',
    regionLabel: 'Экспорты',
  },
  'stat-grid': {
    items: [
      {
        value: '62',
        label: 'Блоков в реестре',
        delta: '+10',
        deltaDirection: 'up-is-good',
        deltaRose: true,
      },
      {
        value: '1.8s',
        label: 'Медианное время экспорта',
        delta: '−32%',
        deltaDirection: 'down-is-good',
        deltaRose: false,
      },
      {
        value: '51',
        label: 'Пресетов движения',
        delta: '+6',
        deltaDirection: 'up-is-good',
        deltaRose: true,
      },
      {
        value: '0',
        label: 'Нарушений axe',
        delta: '',
        deltaDirection: 'neutral',
        deltaRose: false,
      },
    ],
  },
  'progress-ring': {
    label: 'Ход миграции',
    caption: 'Блоков перенесено',
  },
  timeline: {
    items: [
      {
        date: '2026-01',
        dateLabel: 'Январь',
        title: 'Модель документа',
        body: 'Нормализованное дерево, патчи для истории и формат файла с миграциями.',
        icon: 'file',
      },
      {
        date: '2026-03',
        dateLabel: 'Март',
        title: 'Канвас',
        body: 'Зум, панорама, привязки и оверлеи, и каждый узел — тот компонент, которым он экспортируется.',
        icon: 'layout-grid',
      },
      {
        date: '2026-05',
        dateLabel: 'Май',
        title: 'Движение',
        body: 'Пятьдесят один пресет в шести каналах и один путь reduced motion через все.',
        icon: 'zap',
      },
      {
        date: '2026-08',
        dateLabel: 'Август',
        title: 'Реестр',
        body: 'Шестьдесят два блока, у каждого — схема, контролы, кодогенерация и заметки о доступности.',
        icon: 'grid',
      },
    ],
    regionLabel: 'Хронология',
  },
  'chart-preview': {
    seriesLabel: 'Экспортов в неделю',
  },
  'input-field': {
    label: 'Электронная почта',
    hint: 'Используем только чтобы ответить вам.',
    placeholder: 'you@company.com',
  },
  'select-field': {
    label: 'Цель экспорта',
    hint: 'Это можно поменять позже в диалоге экспорта.',
    options: [
      {
        value: 'react',
        label: 'React',
      },
      {
        value: 'next',
        label: 'Next.js',
      },
      {
        value: 'html',
        label: 'Статичный HTML',
      },
      {
        value: 'json',
        label: 'Только JSON',
      },
    ],
    placeholder: 'Выберите цель',
  },
  'checkbox-field': {
    label: 'Что вам присылать?',
    hint: 'Отметьте сколько угодно.',
    choices: [
      {
        value: 'release-notes',
        label: 'Заметки о релизах',
        hint: 'Что вышло, раз в месяц.',
        checked: true,
        disabled: false,
      },
      {
        value: 'deep-dives',
        label: 'Инженерные разборы',
        hint: '',
        checked: false,
        disabled: false,
      },
      {
        value: 'events',
        label: 'События и воркшопы',
        hint: '',
        checked: false,
        disabled: false,
      },
    ],
  },
  'contact-form': {
    heading: 'Расскажите, что вы собираете',
    description: 'Мы читаем всё и отвечаем в течение рабочего дня.',
    submitLabel: 'Отправить',
    submittingLabel: 'Отправляем',
    successTitle: 'Сообщение отправлено',
    successBody: 'Ответим на указанный адрес в течение рабочего дня.',
    failureMessage: 'Не отправилось. Попробуйте ещё раз через минуту.',
  },
  'waitlist-form': {
    label: 'Электронная почта',
    placeholder: 'you@company.com',
    invalidMessage: 'Введите корректный адрес почты.',
    submitLabel: 'В список ожидания',
    submittingLabel: 'Записываем',
    successTitle: 'Вы в списке',
    successBody: 'Напишем, когда будет что попробовать.',
    failureMessage: 'Не отправилось. Попробуйте ещё раз через минуту.',
    note: 'Одно письмо на запуске. Больше ничего.',
  },
}
