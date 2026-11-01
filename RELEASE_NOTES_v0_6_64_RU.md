# NBDT v0.6.64 — Overview glass KPI row and compact lower layout

Дата: 2026-11-01

## Что изменено

### Overview
- Усилен эффект матового стекла только у верхнего ряда KPI-карточек (Base Configuration, Ready for Deployment, Deployed, Cyber Approved).
- Сохранён единый полукруглый индикатор прогресса без дублирования progress bar.
- Убран блок **Demo data, backup & audit** со страницы Overview.
- Нижняя часть Overview переразложена компактнее:
  - `System readiness` остаётся основным широким блоком слева;
  - `Recorded activity` и `Ownership coverage` перенесены в правую компактную колонку;
  - вертикальное пространство используется плотнее и чище.
- Боковое меню не изменялось.

## Файлы
- `index.tsx`
- `nbdt-overview-v061.css`
- `nbdt-overview-kpi-v063.css`

## Примечание
- Данные, логика расчётов и ссылки Overview сохранены. Изменения касаются компоновки и визуального оформления.
