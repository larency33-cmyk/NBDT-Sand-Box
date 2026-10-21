# NBDT v0.7 — начать здесь

Это новый исходный архив на базе v0.6, с улучшенным Weekly Tracker. Начните с **NBDT_v0_7_weekly_tracker_report_RU.md**.

1. Если на сайте есть важные локальные данные, сначала экспортируйте проект: Overview → Demo data, backup & audit → Export project backup.
2. Распакуйте архив в чистую папку. В Windows запустите `START_WINDOWS.cmd` (Node.js 22.12+ и интернет для установки npm-зависимостей).
3. Для публикации выполните `npm run lint` и `npm run build`, проверьте UI в браузере и загрузите проект на Vercel.
4. Эталонные изображения: `design_references/`. Остальные модули и данные сохранены.

**Проверки:** 80/80 unit/static PASS, 0 TSX-синтаксических ошибок, корректный CSS. Полный Vite build и Chrome-сверка этого ZIP в текущей среде не подтверждены.
