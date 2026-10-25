# NBDT v0.6.25 — Move Previous / Title Only

- В контекстном меню задания добавлено **Move to previous week**. На Week 1 команда недоступна: нет предшествующей проектной недели.
- **Move to next week** работает как раньше. Перемещение назад и вперед сохраняет остальные недели существующих многонедельных заданий. В целевой неделе не создаётся дубль старого вхождения той же записи.
- **Edit** отображает только одно поле **Task title**, кнопки Save changes и Cancel. Описание, Owner, System, Duration и Due date не меняются при переименовании.
- Действия работают через существующую очередь IndexedDB и требуют Edit mode. Все изменения касаются только Weekly Tracker.
- Правки затронули `index.tsx`, `src/workspace.tsx`, `src/tracker-actions.mjs`, `weekly-tracker-task-actions-v024.css`, `package.json` и тесты.
- Старые записи в IndexedDB сохраняются; левое меню и остальные разделы не менялись.
