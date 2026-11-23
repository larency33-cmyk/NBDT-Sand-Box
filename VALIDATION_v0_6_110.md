# NBDT Hub v0.6.110 — проверка

## Реализовано
- Внешняя синяя рамка поля `Search systems` на всех четырёх сторонах.
- У вложенного `input` прозрачный фон вместо непрозрачного белого, который перекрывал верх/низ границы.
- Меню `All statuses`: иконки из общего `RegistryStatusGlyph`, без декоративных круглых подложек и без принудительного синего цвета.
- `Completed`: заполненный зелёный круг с белой галочкой. `In progress`: разомкнутая синяя окружность. `Not started`: пустая серая окружность.
- Не изменены расчёт статусов, сохранение, выбор фильтров, карточки и элементы других разделов.

## Выполненные тесты (текущая среда)
- `node --test tests/registry-search-filter-icons-v110.test.mjs tests/registry-connection-icons-v097.test.mjs tests/registry-status-icons-v109.test.mjs`: **13/13 пройдено**.
- `npm run check:syntax`: **пройдено**, ошибок синтаксиса нет.
- `node scripts/check-symbols.cjs`: **пройдено** для 14 TSX файлов.
- `npm test`: **604 passed / 23 failed / 627 total**. Список 23 падений совпадает с v0.6.109, новых ошибок нет.
- `npm run build`: **не завершена** — `vite: not found`, отсутствуют npm-зависимости в этой среде. Production boot НЕ подтверждён.
- Chromium/Playwright isolated CSS sample: проверены размеры **1563×700**, **900×680**, **390×844**; у Search border-top / border-bottom = `1px solid rgb(201, 219, 239)`, вложенный input имеет прозрачный фон и помещается внутри границы, SVG цветов `rgb(19,160,90)`, `rgb(8,116,246)`, `rgb(135,155,182)`. Визуальная проверка изолированного фрагмента ≠ работа полноценного приложения.

Status: **source/isolated UI verified; production build unverified**.
