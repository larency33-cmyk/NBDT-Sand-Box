# NBDT Hub v0.6.82 — правильное разделение модели, типа и описания устройства

## Исправления

1. **Device Type ≠ Device Model.** `PC`, `Tablet`, `Phone`, `Laptop`, `POS`, `Kiosk`, `App only` — это типы устройств. Их больше нельзя подставлять вместо конкретной модели в карточке System Registry или поле Endpoint в System Guide. Новый канонический ключ — `deviceModel`; прежний `deviceType` оставлен как совместимый ключ для модели в исторических записях.
2. **Endpoint / Device Model.** Значение под заголовком `Endpoint` в Excel (например, `Lenovo ThinkPad T14 GEN 5`) импортируется как модель и показывается в System Registry и внутри Guide. Если модель неизвестна, отображается `—`/`Not specified`, а не общий тип `PC`.
3. **Description.** В шаблоне Excel строка `Hardware deployment and configuration required` служебная и не импортируется; текст после неё и до `Endpoint` импортируется в Description. Короткие значения, например `Deployment venue` или `Deployment Training`, тоже распознаются. Отдельное поле `Description:` продолжает работать.
4. **Одинаковая иконка.** Внешняя карточка и `Guide → Technical essentials → Device` теперь используют один SVG-компонент с иконкой выбранного Device Type. Выбранная вручную категория имеет приоритет над попытками угадать тип по названию модели/системы.
5. **Редактирование вручную сохранено.** В Guide при редактировании Device доступны отдельные поля `Device model` и `Device type`. Изменения модели синхронизируются с прежним полем хранения для обратной совместимости.

## Повторный импорт существующих систем

Если ранее система была импортирована с неверным описанием/моделью, открой её Guide и **повтори Import from Excel** после обновления сайта. Это заменит только распознанные поля. Неопознанные поля остаются без изменений; чек-листы, Lessons Learned и зафиксированные проверки не отмечаются автоматически. Невозможно автоматически восстановить потерянное описание из старых данных без повторной вставки Excel.

## Изменённые файлы

- `index.tsx`
- `src/workspace.tsx`
- `src/registry-metadata.mjs`
- `src/guide-excel-import.mjs`
- `src/extended-model.mjs`
- `src/device-type-icon.tsx` (новый)
- `nbdt-registry-v082.css` (новый)
- `tests/registry-excel-v082.test.mjs` (новый)
- `package.json`, `README.md`, release notes, GitHub manifest и changelog.

## Проверки

- 442/442 автоматических Node-теста пройдены, включая импорт текстового и HTML-Excel шаблона OHC — On the Go.
- `npm run check:syntax` — пройдено.
- `node scripts/check-symbols.cjs` — пройдено.
- Полная Vite production-сборка и развёрнутый браузерный прогон здесь не подтверждены: отсутствуют локальные npm-зависимости.
