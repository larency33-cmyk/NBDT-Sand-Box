# NBDT v0.6.1 — Weekly Tracker Alignment Report

## Что изменено

Эта ревизия построена **на базе принятой пользователем версии v0.6**, без переноса неудачных решений из отклонённой v0.7.

Основные изменения:

1. **Weekly Tracker Overview переработан ближе к согласованному макету**
   - улучшена визуальная иерархия шапки и toolbar;
   - summary превращён в отдельные метрики-pill вместо одной длинной строки;
   - недельные колонки получили более явный header и более чистую структуру.

2. **Milestones встроены прямо над каждой недельной колонкой**
   - если milestone существует, он показывается отдельным chip-блоком;
   - если milestone нет, отображается нейтральный placeholder;
   - в local edit mode можно добавить milestone для конкретной недели прямо из header колонки;
   - в правой панели выбранной недели milestones этой недели также видны отдельно.

3. **Master Timeline убран из Weekly Tracker UI**
   - удалена кнопка `Master Timeline` из шапки Weekly Tracker;
   - share link теперь копирует текущий weekly tracker view без принудительного переключения на legacy timeline.

4. **Исправлены акценты и выравнивание**
   - поправлено центрирование букв в круглых avatar-бейджах;
   - улучшены паддинги, радиусы, header неделей, visual chips и состояние selected week cell;
   - styling rows/empty states приведён ближе к одобренному визуальному направлению.

## Что сознательно не менялось

- Глобальная demo-data модель и существующие seeded records.
- Существующие screen sections Systems / Issues / Configuration Report.
- Основной routing проекта и локальная demo-storage логика.
- Legacy internal roadmap structures вне Weekly Tracker перепроектированы не полностью; текущая ревизия фокусируется на Weekly Tracker UI, который пользователь попросил доработать в первую очередь.

## Проверки

Подтверждено в среде сборки архива:

- `node scripts/check-syntax.cjs` — без ошибок;
- `node scripts/check-bindings.cjs` — 0 unbound identifier errors.

Не подтверждено в этой среде:

- полный `npm install`;
- production `npm run build`;
- визуальный browser-regression прогон в Chromium после этих конкретных правок.

## Итог

Версия v0.6.1 предназначена как **точечная refinement-ревизия**: она не делает новый продукт, а доводит Weekly Tracker до состояния, близкого к согласованному макету, и убирает лишний акцент на Master Timeline внутри этого рабочего сценария.
