# v0.6.109 — проверки

Изменения ограничены отрисовкой трёх иконок статусов в карточках System Registry и фильтре «All statuses».

- Completed/Stage: зелёный диск с белой галочкой.
- Completed/Overall: контурная зелёная окружность с галочкой.
- In progress: синее частичное кольцо вместо CircleDot.
- Not started: серый незаполненный контур.
- Реальная функция расчёта статуса: без изменений (src/registry-progress.mjs).
- Проверены контракты нового компонента (tests/registry-status-icons-v109.test.mjs).
- Логика редактирования и удаления системы: без изменений.

## Фактические результаты
- `node --test tests/registry-progress-v108.test.mjs tests/registry-status-icons-v109.test.mjs`: **15/15 passed**.
- `npm run check:syntax`: **passed**, `index.tsx` и другие TSX без синтаксических ошибок.
- `node scripts/check-symbols.cjs`: **passed**, 14 TSX файлов.
- `npm test`: **600 passed, 23 failed, 623 total**. 23 оставшихся сбоя — те же базовые тестовые ошибки v0.6.108, все четыре новые проверки статусов прошли.
- `npm run build`: preflight passed, но **Vite не установлен** (`sh: 1: vite: not found`), production build в среде не подтверждён.
- Мини-визуальная проверка статусов в Chromium: проверены 12 SVG-иконок (по 4 в каждом из трёх статусов). Это не полноценная проверка работы собранного приложения.
