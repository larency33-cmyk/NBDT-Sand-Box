# NBDT v0.6.36 — Clean Configuration Guide

**Основа:** NBDT v0.6.35 (проверена по `main` GitHub).

## Изменено только при открытии System Registry → Open guide

Удалены отображаемые в старом интерфейсе блоки:

1. Панель **Endpoint profile** с выпадающим списком, **Add endpoint profile** и связанным редактором вторичного профиля.
2. Отдельная строка навигации **Systems / [System] / Guide** (кнопка **Back to systems** в заголовке остаётся).
3. Отдельная полоса **Guide preview · Select a device to record completion**, список устройств и предложение **Start device run**.
4. Секция **Register an actual device** с раскрываемой формой.
5. Информационный баннер **No reviewed guide has been published...**.
6. Раскрываемый блок **Legacy system checklist · not device completion**.
7. Нижняя подпись **Demo mode. Local record versions and audit...**.

Теперь содержимое страницы начинается с названия системы и основных действий, затем идут **Technical essentials**, **Lessons Learned** и **Configuration checklists**. Редактор гайда и базовые три этапа сохранены.

**Важно:** скрытие интерфейса регистрации / выбора устройств означает, что создать новый device run или переключить профиль из этой страницы больше нельзя. При этом существующие системные профили, зарегистрированные устройства, device runs и история прохождения этапов **не удаляются** из модели и IndexedDB. При открытии сохранённого маршрута с `profileId` и `deviceId` соответствующий профиль и запись продолжают читаться. Это изменение интерфейса, не миграция и не удаление данных.

## Проверки

- `npm test`: **226/226 PASS**.
- `npm run check:syntax`: **0 parse errors** для `index.tsx`, `src/workspace.tsx`, `src/enhancements.tsx` и `vite.config.ts`.
- Проверены исходные JSX-строки удалённых блоков — в компоненте открытого гайда их больше нет.
- Полная сборка Vite и проверки Playwright в браузере здесь не запускались из-за отсутствия установленных npm-зависимостей в среде.

## Доставка

- `NBDT_Full_Project_v0_6_36.zip` — полный код на основе v0.6.35 + правки.
- `NBDT_Changed_Files_v0_6_36_GitHub.zip` — только изменённые и новые файлы, с исходной структурой папок.

**На GitHub и Vercel изменения не загружались.**
