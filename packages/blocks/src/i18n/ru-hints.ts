/**
 * Every control hint in the registry, in Russian, keyed by the English sentence — ADR-365.
 *
 * A hint is the one place the inspector explains a decision rather than naming a value, so these
 * are translated as sentences and not as terms: the English says *why*, and so does the Russian.
 */
export const RU_HINTS: Readonly<Record<string, string>> = {
  'One per column. "yes" and "no" draw a mark; anything else is shown as text':
    'По одному на колонку. «yes» и «no» рисуют знак, всё остальное показывается текстом',
  'Multiplies the duration tokens; reduced motion stops it entirely':
    'Умножает токены длительности; ограниченная анимация останавливает это полностью',
  'Replaces the form, and takes focus so a screen reader knows it worked':
    'Заменяет форму и забирает фокус, чтобы скринридер понял: получилось',
  'Small print beside the button — a consent line, a link to a policy':
    'Мелкий текст рядом с кнопкой — согласие, ссылка на политику',
  'When the handler itself failed. Not the reader’s fault, so not a field’s error':
    'Когда сломался сам обработчик. Читатель не виноват, поэтому это не ошибка поля',
  '60–75 characters is the readable range; full width is a deliberate choice':
    '60–75 знаков — читаемый диапазон; полная ширина — осознанное решение',
  'A WebVTT file. Required unless the footage is decorative':
    'Файл WebVTT. Обязателен, если видео не декоративное',
  'A column of free text sorts into an order nobody asked for — turn sorting off for those':
    'Колонка свободного текста сортируется в порядке, которого никто не просил — для таких сортировку выключают',
  'A consent line under the field. Empty drops it':
    'Строка согласия под полем. Пустое значение убирает её',
  'A falling error rate is an improvement, and the block cannot guess that':
    'Падение доли ошибок — это улучшение, и блок сам об этом не догадается',
  'A falling error rate is an improvement; the block cannot guess that':
    'Падение доли ошибок — это улучшение; блок сам об этом не догадается',
  'A file, a URL, or a data URL within the format’s size limit':
    'Файл, ссылка или data-URL в пределах ограничения формата по размеру',
  'A fragment id so this section can be linked to. Never generated from the text':
    'Идентификатор фрагмента, чтобы на секцию можно было сослаться. Никогда не берётся из текста',
  'A label turns the rule into line-text-line':
    'Подпись превращает линию в «линия — текст — линия»',
  'A radio group takes one answer, so only the first checked choice counts':
    'Группа радиокнопок принимает один ответ, поэтому считается только первый отмеченный вариант',
  'A range like 2-4,7. Anything unparseable highlights nothing':
    'Диапазон вида 2-4,7. Всё, что не разбирается, ничего не подсветит',
  'A row of full-colour marks competes with the page and with itself':
    'Ряд полноцветных знаков конкурирует и со страницей, и сам с собой',
  'A row’s text is shown until a block is dropped into its panel':
    'Текст ряда виден, пока в его панель не положат блок',
  'A rule between the children': 'Линия между детьми',
  'A rule between the items': 'Линия между элементами',
  'A short arc reads as a comet; a long one as a rotating gradient':
    'Короткая дуга читается как комета, длинная — как вращающийся градиент',
  'A slide’s text is shown until a block is dropped into it':
    'Текст слайда виден, пока в него не положат блок',
  'A slow swell in opacity and scale — off by default, because a pulsing section holds the eye':
    'Медленное нарастание прозрачности и масштаба — по умолчанию выключено: пульсирующая секция удерживает взгляд',
  'A soft accent field behind the headline': 'Мягкое акцентное поле за заголовком',
  'A step’s text is shown until a block is dropped into it':
    'Текст шага виден, пока в него не положат блок',
  'A surface and a hairline around the figure, for a chart not already inside a band':
    'Поверхность и тонкая линия вокруг рисунка — для графика, который не стоит внутри полосы',
  'A value and the word the reader sees. The value cannot be empty':
    'Значение и слово, которое видит читатель. Значение не может быть пустым',
  'A word works too — Free, Custom': 'Слово тоже подойдёт — «Бесплатно», «Индивидуально»',
  'Always in the markup. The switch below only decides whether it is drawn':
    'Всегда есть в разметке. Переключатель ниже решает только, рисовать ли её',
  'Always visible. A placeholder is not a label':
    'Всегда видна. Текст-заполнитель — это не подпись',
  'An option’s value. Empty starts on the placeholder':
    'Значение варианта. Пустое оставляет выбор на тексте-заполнителе',
  'Announced before the error, as part of the field’s description':
    'Объявляется перед ошибкой, как часть описания поля',
  'Auto-fit only': 'Только в режиме автоподбора',
  'Autoplay forces it — a page that makes noise at somebody is blocked anyway':
    'Автовоспроизведение включает это принудительно — страницу, которая шумит на человека, браузер всё равно заблокирует',
  'Bars measure from zero; a line reads a trend and normalises to its own range':
    'Столбцы считаются от нуля; линия показывает тренд и нормируется по своему диапазону',
  'Belongs to this choice rather than to the group': 'Относится к этому варианту, а не к группе',
  'Below 640 px: swipe through the cards, or stack them':
    'Ниже 640 px: листать карточки или ставить их друг под друга',
  'Below 640 px: swipe through the cells, or stack them':
    'Ниже 640 px: листать ячейки или ставить их друг под друга',
  'Below 640 px: swipe through the figures, or stack them':
    'Ниже 640 px: листать цифры или ставить их друг под друга',
  'Below 640 px: swipe through the items, or stack them':
    'Ниже 640 px: листать элементы или ставить их друг под друга',
  'Below 640 px: swipe through the plans, or stack them':
    'Ниже 640 px: листать тарифы или ставить их друг под друга',
  'Beside the label, never instead of it': 'Рядом с подписью, но никогда вместо неё',
  'Beyond this, the middle folds into a menu': 'Дальше этого числа середина сворачивается в меню',
  'Beyond this, the middle folds into a menu ': 'Дальше этого числа середина сворачивается в меню',
  'Bold, italic, inline code, links and lists. A paste keeps its text and loses the rest':
    'Жирный, курсив, код в строке, ссылки и списки. При вставке остаётся текст, остальное теряется',
  'Cells share a hairline instead of a gap': 'Ячейки делят тонкую линию вместо зазора',
  'Changes the arrangement. The same seed always places the same field':
    'Меняет расположение. Одно и то же зерно всегда даёт одно и то же поле',
  'Changes the keyboard a phone offers and the checks a browser runs':
    'Меняет клавиатуру, которую предложит телефон, и проверки, которые сделает браузер',
  'Checkboxes answer “any of these”, radios answer “one of these”':
    'Чекбоксы отвечают на «любые из этих», радиокнопки — на «один из этих»',
  'Collapses to one column below the medium breakpoint':
    'Ниже среднего брейкпоинта сходится в одну колонку',
  'Consecutive rows with the same group are drawn under one heading':
    'Идущие подряд ряды одной группы рисуются под общим заголовком',
  'Dealt round-robin across the rows, so reordering one moves one':
    'Раздаются по рядам по кругу, поэтому перестановка одного двигает один',
  'Defaults to the name': 'По умолчанию берётся имя',
  'Drawn after the figure, never announced': 'Рисуется после цифры и никогда не объявляется',
  'Drawn in the marker when the marker is set to Icon':
    'Рисуется в маркере, когда маркер переключён на иконку',
  'Draws the names you gave above. Off leaves them to the screen reader only':
    'Рисует имена, заданные выше. Если выключить, они останутся только для скринридера',
  'Each entry is one cell, in order. A breakpoint override replaces the whole arrangement':
    'Каждая запись — одна ячейка, по порядку. Переопределение на брейкпоинте заменяет всю раскладку',
  'Each row swaps the side the picture sits on': 'Каждый ряд меняет сторону, где стоит картинка',
  'Emitted by the export only. Structured data that does not match the page is a penalty':
    'Попадает только в экспорт. Разметка, не совпадающая со страницей, — это штраф',
  'Empty announces "68 percent complete". Write your own when the range is a count':
    'Пустое объявляет «68 процентов выполнено». Своё пишут, когда диапазон — это счёт',
  'Empty draws the author’s initial rather than an empty circle':
    'Пустое рисует инициал автора, а не пустой круг',
  'Empty draws the initial instead': 'Пустое рисует вместо этого инициал',
  'Empty hides the change row': 'Пустое прячет строку изменения',
  'Empty hides the row': 'Пустое прячет строку',
  'Empty makes it a button rather than a link': 'Пустое делает это кнопкой, а не ссылкой',
  'Empty means you decided it is decorative':
    'Пустое означает, что вы решили: изображение декоративное',
  'Empty renders a window in surface tokens, which is a finished default rather than a gap':
    'Пустое рисует окно токенами поверхности — это законченное значение по умолчанию, а не дыра',
  'Empty says the direction and the ends. This is what a screen reader gets instead of the drawing':
    'Пустое сообщает направление и края. Это то, что получит скринридер вместо рисунка',
  'Evens the last line instead of leaving one word on it':
    'Выравнивает последнюю строку, вместо того чтобы оставлять на ней одно слово',
  'Fades out at both ends': 'Затухает с обоих концов',
  'Fluid needs a flex parent': 'Тянущемуся отступу нужен флекс-родитель',
  'Focus never waits: a delay there reads as a dropped key':
    'Фокус никогда не ждёт: задержка здесь читается как потерянное нажатие',
  'Free text, so a unit, a multiple or a currency all fit':
    'Свободный текст: подойдёт и единица, и множитель, и валюта',
  'Glass needs a background behind it': 'Стеклу нужен фон за ним',
  'Glyphs only, names kept, and a label beside the glyph on hover and on focus':
    'Только глифы, имена сохранены, а подпись появляется рядом при наведении и фокусе',
  'Grid mode only': 'Только в режиме сетки',
  'Grid mode. Two on a phone whatever this says':
    'Режим сетки. На телефоне всегда две, что бы здесь ни стояло',
  'Hairline, radius and shadow around the slot': 'Тонкая линия, радиус и тень вокруг слота',
  'Hidden it stays in the accessibility tree — a placeholder is not a label':
    'Скрытая, она остаётся в дереве доступности — текст-заполнитель не заменяет подпись',
  'Hides the banding a large gradient shows on an 8-bit display':
    'Скрывает полосы, которые большой градиент даёт на 8-битном экране',
  'Hides the banding a wide gradient shows on an 8-bit display':
    'Скрывает полосы, которые широкий градиент даёт на 8-битном экране',
  'Holds the top of the viewport': 'Держится у верхнего края окна',
  'Horizontal scrolls with snap and takes focus so a keyboard can move through it':
    'Горизонтальная прокручивается с привязкой и принимает фокус, чтобы по ней можно было идти с клавиатуры',
  'How far either side of the cursor the swell carries, in pixels':
    'Насколько далеко в обе стороны от курсора расходится увеличение, в пикселях',
  'How large the item under the cursor gets. Focus uses the same number':
    'Насколько вырастает элемент под курсором. Фокус использует то же число',
  'How wide the image renders at each breakpoint; 100vw unless you know better':
    'Какой ширины изображение рисуется на каждом брейкпоинте; 100vw, если нет причин иначе',
  'Icons keeps each label as its accessible name':
    'Режим иконок оставляет каждую подпись доступным именем',
  'Ignored in rail mode, where there is nowhere to put a disclosure':
    'Игнорируется в режиме полосы, где раскрывающемуся элементу негде разместиться',
  'Inline, never fetched. Two points is the fewest that has a shape':
    'Прямо в разметке, без запросов. Две точки — минимум, у которого есть форма',
  'Keeps text in front of the aurora legible. Off only for a band with no copy on it':
    'Сохраняет читаемость текста поверх авроры. Выключают только для полосы без текста',
  'Keeps text in front of the mesh legible. Off only for a band with no copy on it':
    'Сохраняет читаемость текста поверх меша. Выключают только для полосы без текста',
  'Leave it empty and the link stays a link': 'Оставьте пустым — и ссылка останется ссылкой',
  'Leave it empty to drop the line': 'Оставьте пустым, чтобы убрать строку',
  'Leave it empty to drop the line entirely': 'Оставьте пустым, чтобы убрать строку целиком',
  'Lets a short item fill a gap above it': 'Позволяет короткому элементу заполнить пустоту над ним',
  'Lower is a stronger lens; higher flattens the rotation out':
    'Меньше — сильнее линза; больше — поворот выпрямляется',
  'MP4 or WebM. A third-party embed is an iframe, and this block does not render one':
    'MP4 или WebM. Чужой встраиваемый плеер — это iframe, а этот блок его не рисует',
  'MP4 or WebM. Muted and looping — a hero is not a player':
    'MP4 или WebM. Без звука и по кругу — герой не проигрыватель',
  'Marks it busy and dims it. The click guard is the reader’s own handler':
    'Помечает занятым и приглушает. Защита от повторного клика — на стороне вашего обработчика',
  'Marks the label and sets aria-required': 'Помечает подпись и проставляет aria-required',
  'Needs a background behind it': 'Нужен фон за ним',
  'Off by default: a fine pattern in motion is the likeliest thing here to bother someone':
    'По умолчанию выключено: мелкий узор в движении здесь вероятнее всего кому-то помешает',
  'Off is what reduced motion sees, so this is also how you preview it':
    'Выключенное состояние — это то, что видит режим ограниченной анимации, так что заодно это его превью',
  'Off keeps it in the markup for screen readers':
    'Выключенное оставляет это в разметке для скринридеров',
  'Off keeps the sample scrollable, which is what a keyboard can reach':
    'Выключенное оставляет фрагмент прокручиваемым — до него достаёт клавиатура',
  'Off makes it graph paper, which is occasionally what you want':
    'Выключенное превращает это в миллиметровку, что иногда и нужно',
  'Off pins the light to the centre — the same composition a touch device gets':
    'Выключенное прибивает свет к центру — та же композиция, что достаётся сенсорным устройствам',
  'Off under reduced motion, paused on hover and focus, and always with a pause button':
    'Выключается при ограниченной анимации, встаёт на паузу при наведении и фокусе, и всегда с кнопкой паузы',
  'On an exported page this opens the dialog on load':
    'На выгруженной странице это откроет диалог при загрузке',
  'On, the grid is one plate divided; off, the figures sit on the page':
    'Включено — сетка становится единой разделённой подложкой; выключено — цифры стоят прямо на странице',
  'One at a time, or as many as the reader likes':
    'По одному за раз — или столько, сколько захочет читатель',
  'One full loop. Each row runs slightly slower than the one above it':
    'Один полный проход. Каждый ряд идёт чуть медленнее предыдущего',
  'One highlighted column reads as the recommendation; two read as indecision':
    'Одна выделенная колонка читается как рекомендация; две — как нерешительность',
  'One step below the heading above it, or the page skips a level':
    'На ступень ниже заголовка над ним, иначе страница перепрыгнет уровень',
  'One step below the heading above the strip': 'На ступень ниже заголовка над лентой',
  'One value per column, in column order. A missing value shows as an em dash':
    'По одному значению на колонку, в порядке колонок. Отсутствующее показывается тире',
  'Overlay and soft-light keep the value underneath and disturb only local contrast':
    'Overlay и soft-light сохраняют светлоту под собой и трогают только локальный контраст',
  'Paints the media on the left; the text still reads first on a phone':
    'Рисует медиа слева; на телефоне текст всё равно читается первым',
  'Paints the text with the accent ramp': 'Красит текст акцентной шкалой',
  'Place a newsletter form in the slot; the frame appears only when one is there':
    'Положите форму подписки в слот; рамка появится только вместе с ней',
  'Read aloud when a keyboard reader tabs into the scrollable table':
    'Зачитывается, когда пользователь клавиатуры попадает в прокручиваемую таблицу',
  'Read out as the control’s description, whether or not the bubble is showing':
    'Зачитывается как описание контрола независимо от того, видно ли всплывающее окно',
  'Renders a textarea, with the same wiring': 'Рисует textarea с той же обвязкой',
  'Replaces the row, and takes focus so a screen reader knows it worked':
    'Заменяет строку и забирает фокус, чтобы скринридер понял: получилось',
  'Requests it with the document instead of lazily. Only for what is visible first':
    'Запрашивает вместе с документом, а не лениво. Только для того, что видно сразу',
  'Required. Leave it empty only when the image is decorative — that is a decision, not a skip':
    'Обязательно. Пустым оставляют только для декоративного изображения — это решение, а не пропуск',
  'Required: a dialog is announced by its title and its description':
    'Обязательно: диалог объявляется своим заголовком и описанием',
  'Say what to do — “Enter a valid email address”, not “Invalid input”':
    'Скажите, что сделать: «Введите корректный адрес почты», а не «Неверный ввод»',
  'Say what to do — “Enter a valid email address”, not “Invalid input”. Empty means valid':
    'Скажите, что сделать: «Введите корректный адрес почты», а не «Неверный ввод». Пустое значит «всё верно»',
  'Short proof under the buttons — licence, pricing, a customer count':
    'Короткое подтверждение под кнопками — лицензия, цена, число клиентов',
  'Shown as a word-mark until a file arrives, and used as the alt text':
    'Показывается словесным знаком, пока нет файла, и служит alt-текстом',
  'Shown inside the table body, spanning every column':
    'Показывается внутри таблицы, на всю ширину колонок',
  'Shown until a block is dropped into the dialog': 'Видно, пока в диалог не положат блок',
  'Shown until a block is dropped into this panel': 'Видно, пока в эту панель не положат блок',
  'Shown when the side is set to buttons': 'Показывается, когда сторона переключена на кнопки',
  'Shows on the highlighted plan only': 'Показывается только на выделенном тарифе',
  'Single closes the previous row; multiple leaves them all open':
    '«Один» закрывает предыдущий ряд, «несколько» оставляет все открытыми',
  'Single is a radio group; multiple is a toolbar of pressed buttons':
    '«Один» — это группа радиокнопок, «несколько» — панель нажатых кнопок',
  'Small print under the row — a consent line, a link to a policy':
    'Мелкий текст под строкой — согласие, ссылка на политику',
  'So the column nests under whatever heading is above it':
    'Чтобы колонка вложилась под тот заголовок, который стоит выше',
  'So the section nests under whatever heading is above it':
    'Чтобы секция вложилась под тот заголовок, который стоит выше',
  'Starts from script and never under reduced motion; a poster is what shows instead':
    'Запускается скриптом и никогда при ограниченной анимации; вместо этого показывается постер',
  'Stretch fills the width; the columns stay equal either way':
    'Растяжение занимает всю ширину; колонки в любом случае остаются равными',
  'Styles the first letter; it stays one character of text':
    'Оформляет первую букву; это по-прежнему один символ текста',
  'The background runs to the window edges': 'Фон доходит до краёв окна',
  'The company name, if the mark is the only place it appears':
    'Название компании — если знак единственное место, где оно есть',
  'The file’s real pixel width — it is what reserves the box':
    'Настоящая ширина файла в пикселях — именно она резервирует место',
  'The footage says nothing the copy does not': 'Видео не говорит ничего сверх текста',
  'The footage says nothing the page does not': 'Видео не говорит ничего сверх страницы',
  'The glass treatment arrives once the page has scrolled, not at the top':
    'Стекло появляется после прокрутки, а не наверху страницы',
  'The header stays put while the rows scroll under it':
    'Шапка остаётся на месте, пока строки прокручиваются под ней',
  'The href that gets aria-current. Empty means none':
    'Адрес, которому достанется aria-current. Пустое — никакому',
  'The index that starts selected. −1 starts with none':
    'Индекс, выбранный изначально. −1 — не выбрано ничего',
  'The label is the accessible name and the tag above the glyph — one string, both jobs':
    'Подпись служит и доступным именем, и биркой над глифом — одна строка на две задачи',
  'The last one is the page the reader is on, and is not a link':
    'Последняя — это страница, на которой читатель сейчас, и она не ссылка',
  'The name is built from the brand and the network — Motion Studio on GitHub':
    'Имя собирается из бренда и сети — «Motion Studio в GitHub»',
  'The page needs one, and this block is the thing it skips':
    'Странице она нужна, а этот блок — то, что пропускают',
  'The panel is hidden from screen readers, so this sentence is what they get instead':
    'Панель скрыта от скринридеров, поэтому им достаётся это предложение',
  'The real values, for a reader who wants to check the summary':
    'Настоящие значения — для читателя, который хочет проверить сводку',
  'The table’s accessible name. Empty falls back to the region label':
    'Доступное имя таблицы. Пустое отдаёт эту роль подписи области',
  'The text of a tab is shown until a block is dropped into its panel':
    'Текст вкладки виден, пока в её панель не положат блок',
  'Three labelled gridlines. Bars are scaled from zero, a line from its own range':
    'Три подписанные линии сетки. Столбцы масштабируются от нуля, линия — по своему диапазону',
  'Turn it off on a coloured band — the mask fades to transparent, not to the band':
    'Выключите на цветной полосе: маска затухает в прозрачность, а не в цвет полосы',
  'Two points or more; fewer draws nothing': 'Две точки или больше; меньше не нарисует ничего',
  'Used in the hidden table. Fewer names than points falls back to the position':
    'Используется в скрытой таблице. Если имён меньше, чем точек, берётся номер позиции',
  'What a parser reads: 2026-03, 2026-03-18. Empty drops the time element':
    'То, что читает парсер: 2026-03, 2026-03-18. Пустое убирает элемент time',
  'What a screen reader announces for this control': 'Что скринридер объявит для этого контрола',
  'What a screen reader announces for this navigation': 'Что скринридер объявит для этой навигации',
  'What a screen reader announces when a keyboard user reaches the scroller':
    'Что объявит скринридер, когда пользователь клавиатуры доберётся до прокрутки',
  'What shows before playback and under reduced motion':
    'Что показывается до воспроизведения и при ограниченной анимации',
  'What shows before playback and under reduced motion — design it, do not grab it':
    'Что показывается до воспроизведения и при ограниченной анимации — это рисуют, а не берут кадром',
  'What the meter measures. A progressbar with no name is progress towards nothing':
    'Что измеряет индикатор. Полоса прогресса без имени — это прогресс в никуда',
  'What the reader sees. Empty shows the value':
    'То, что видит читатель. Пустое показывает значение',
  'What the trigger shows before a choice is made': 'Что показывает триггер, пока выбор не сделан',
  'What the value is submitted under, and what a browser’s autofill matches on':
    'Под каким именем уходит значение и по чему браузер подбирает автозаполнение',
  'When the handler itself failed. Not the reader’s fault, so not the field’s error':
    'Когда сломался сам обработчик. Читатель не виноват, поэтому это не ошибка поля',
  'Which column reads first on a phone': 'Какая колонка читается первой на телефоне',
  'Which interval the page opens with; the toggle takes it from there':
    'С каким периодом открывается страница; дальше решает переключатель',
  'Without it a reader cannot go back to following their operating system':
    'Без неё читатель не сможет вернуться к настройке своей системы',
  'email, name, tel, street-address. Empty turns autofill off':
    'email, name, tel, street-address. Пустое выключает автозаполнение',
  '−1 highlights nothing; the highlighted plan comes first on a phone':
    '−1 не выделяет ничего; выделенный тариф на телефоне идёт первым',
  '−1 starts them all closed': '−1 оставляет все закрытыми',
  '−1 starts with every row closed': '−1 оставляет все ряды закрытыми',
}
