# Обновление GitHub: NBDT v0.6.11 → v0.6.12

Распаковать `NBDT_Changed_Files_v0_6_12.zip` **в корень репозитория**, сохранив структуру папок. Заменить совпадающие файлы; новые файлы добавить.

## Новые и изменённые файлы

- Изменён: `NBDT_Website_Master_Specification_RU.md`
- Добавлен: `NBDT_v0_6_12_release_notes_RU.md`
- Изменён: `README.md`
- Изменён: `START_HERE_RU.md`
- Добавлен: `design_references/approved_weekly_tracker_v0612.png`
- Изменён: `package.json`
- Изменён: `redesign.css`
- Изменён: `src/workspace.tsx`
- Добавлен: `tests/approved-reference-v0612.test.mjs`
- Изменён: `tests/approved-week-layout-v065.test.mjs`
- Изменён: `tests/weekly-calendar-v062.test.mjs`
- Добавлен: `verification/v0612-test-summary.txt`
- Добавлен: `verification/v0612_geometry.txt`
- Добавлен: `GITHUB_UPDATE_v0_6_12_RU.md`

Удалённых файлов: 0.

**Важно:** Это обновление исходников, не база IndexedDB. Перед деплоем: `npm install`, `npm run lint`, `npm run build`, затем убедиться в браузере, что CSS и разметка соответствуют макету.
