# NBDT v0.6.16 — финальный утверждённый макет Weekly Tracker

Подробности и проверенная геометрия: `NBDT_v0_6_16_release_notes_RU.md`.

# NBDT v0.6.12 — Approved Weekly Tracker Mockup

Последний утверждённый экран Weekly Tracker перенесён из изображения от 24.10.2026. Подробнее: `NBDT_v0_6_12_release_notes_RU.md`.

# NBDT v0.6.11 — Native Week Scrollbar Arrows Fix

Последние исправления и ограничения: `NBDT_v0_6_11_release_notes_RU.md`.

# NBDT v0.6.10 — Week Navigation & Search Focus Fix

Последние изменения и ограничения проверки: `NBDT_v0_6_10_release_notes_RU.md`.

# NBDT v0.6.9 — Independent Week Navigation UX

See `NBDT_v0_6_9_release_notes_RU.md` for verified changes, validation, and setup.

# NBDT Web Project v0.6.8 — Без верхней полосы статуса

Полный исходный код на основе v0.6.7. Удалена постоянная верхняя полоска `Demo data · IndexedDB · no shared sync` со **всех экранов**. При успешном сохранении индикатор не показывается, высота интерфейса освобождена; при реальной ошибке сохранения появится только небольшой overlay-alert внизу справа. IndexedDB и все данные остались без изменений.

**Что изменено:** `NBDT_v0_6_8_release_notes_RU.md`.

**Эталон:** `design_references/approved_weekly_tracker_light_accents.png`.

## Запуск на Windows

Понадобится Node.js 22.12 или новее и доступ к npm registry.

1. Распаковать ZIP в отдельную папку.
2. Запустить `START_WINDOWS.cmd` или в терминале:

```bash
npm install
npm run dev
```

3. Открыть адрес, который напечатает Vite (обычно `http://localhost:5173`).

Перед публикацией:

```bash
npm test
npm run check:syntax
npm run lint
npm run build
```

Успешная сборка создаст `dist/`. Маршруты Vercel настроены в `vercel.json`.

## Данные и функциональность

- Project weeks = Week 1, Week 2… от точной даты старта проекта, независимо от ISO-недель.
- Два режима Weekly Tracker: Overview и List.
- Milestones — отдельный ряд над заданиями; footer содержит четыре недельные карточки, даты, дни и Today.
- Панель задач открывается overlay, меняет статусы и позволяет создать назначение одной строкой.
- Данные хранятся локально в IndexedDB; **это не серверная совместная синхронизация и Edit mode — не корпоративная авторизация**.

Перед деплоем рекомендуется экспортировать backup в текущем проекте. Исходный проект и seed-записи сохранены; архив не должен автоматически очищать существующие данные в браузере.

## Проверки

Локальные unit/static-тесты и три новые проверки баннера; синтаксис TSX и CSS проверен. Полный Vite build и настоящий browser screenshot regression в среде подготовки не подтверждены из-за недоступного npm install — см. release notes. Исторические отчёты лежат в корне ZIP для преемственности.


## Latest local package
- Current prepared build: v0.6.13 (rounded week headers).


## Latest local package
- Current prepared build: v0.6.14 (separated rounded week columns).


## Latest local package
- Current prepared build: v0.6.15 (week columns refined).
