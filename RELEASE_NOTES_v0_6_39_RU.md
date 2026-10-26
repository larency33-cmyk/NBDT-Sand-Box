# NBDT v0.6.39 — Guide as the single technical editor

Основа: **v0.6.38**. Изменения касаются System Registry / Configuration Guide; Weekly Tracker, Issue Tracker и Configuration Report не менялись.

## Что исправлено

1. **Удалена отдельная страница `Edit system / profile`.** На существующих карточках карандаш теперь открывает нужную систему непосредственно в `Guide → Edit guide`.
2. **Technical essentials редактируется в Guide.** Поля Hardware / model, Device type, OS / OS version, Connection, VLAN, IP scope, Reservation, Naming convention, Service account, User account, Authentication type, Domain / OU, MDM / AirWatch и Applications сохраняются в `guideDraft.technicalSnapshot`.
3. **Единый источник данных.** Карточка System Registry и открытый Guide используют одну функцию `guideTechnicalValues()`: последний сохранённый черновик гайда → опубликованный технический снимок → старые значения системы как безопасный миграционный fallback до первого сохранения.
4. При **Save guide changes** изменения сохраняются в локальный Guide. При **Publish reviewed version** публикуется именно редактируемый technicalSnapshot — не старые поля. Ранее сохранённые device runs продолжают ссылаться на свои снимки и не переписываются.
5. **Название системы, описание, владелец, документация и Lessons Learned** также редактируются прямо в Guide; старый редактор профиля больше не нужен.
6. **Add system** открывает только короткую форму создания системы (имя, тип, владелец, описание), а сразу после создания переходит в её Guide для заполнения технических параметров.
7. Поддержка полей `userAccount`, `logonType` включена в снимок Guide. Исторические records и данные endpoint profiles не удалены.
8. Добавлены автоматические тесты, проверяющие приоритет сохранённого черновика, публикацию, отсутствие старого редактора и вход через карандаш.

## Проверки

- Автоматические unit/static tests: 237/237 успешно.
- TypeScript TSX parse diagnostics: 0.
- Разрешение внутренних идентификаторов: 0 ошибок (внешние модули отсутствуют в изолированной среде).
- **Полную сборку Vite и работу в браузере здесь подтвердить не удалось**, поскольку не установлены зависимости React/Vite/Playwright. Для проверки на рабочей машине: `npm install && npm run build && npm test`.

## Архивы

- `NBDT_Full_Project_v0_6_39.zip` — весь очищенный проект.
- `NBDT_Changed_Files_v0_6_39_GitHub.zip` — только добавленные или изменённые файлы с исходными путями относительно v0.6.38.

Обновление не загружено в GitHub/Vercel автоматически. При импорте через ZIP текущие IndexedDB-записи остаются без изменения, но перед обновлениями рекомендуется сделать экспорт проекта.
