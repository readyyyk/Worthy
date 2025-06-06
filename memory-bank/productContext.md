# Контекст продукта

## Описание проекта
Worthy - приложение для учета личных финансов, позволяющее пользователям отслеживать доходы и расходы, управлять балансом и анализировать свои финансовые операции.

## Архитектура

### Технологический стек
- Next.js (React) - фронтенд
- tRPC - типизированный API
- Drizzle ORM - работа с базой данных
- SQLite - база данных
- Tailwind CSS - стилизация
- NextAuth - аутентификация

### Структура базы данных
- `users` - таблица пользователей
- `transactions` - таблица транзакций (доходы/расходы)
- `tags` - таблица тегов для транзакций
- `templates` - таблица шаблонов транзакций
- `template_tags` - таблица тегов для шаблонов

### Основные компоненты
- Страница создания транзакции (`/new`)
- Страница списка транзакций (`/transactions`)
- Страница управления шаблонами (`/templates`)
- Компоненты для редактирования и удаления транзакций и шаблонов

## Функциональность шаблонных трат

### Схема данных
- Таблица `templates` для хранения шаблонов транзакций:
  - `id` - уникальный идентификатор
  - `owner_id` - идентификатор владельца
  - `name` - название шаблона
  - `amount` - сумма
  - `is_income` - флаг дохода/расхода
  - `currency` - валюта
  - `description` - описание

- Таблица `template_tags` для хранения тегов шаблонов:
  - `id` - уникальный идентификатор
  - `template_id` - идентификатор шаблона
  - `text` - текст тега

### API
- `templates.getList` - получение списка шаблонов пользователя
- `templates.getSingle` - получение одного шаблона по ID
- `templates.create` - создание нового шаблона
- `templates.update` - редактирование существующего шаблона
- `templates.delete` - удаление шаблона

### Пользовательский интерфейс
- Компонент выбора шаблона на странице создания транзакции
- Кнопка "Сохранить как шаблон" на форме создания транзакции
- Диалоговое окно для ввода названия шаблона
- Страница управления шаблонами с возможностью редактирования и удаления