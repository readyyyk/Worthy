# Журнал решений

## 01.04.2025 - Удаление кэширования TRPC с использованием localStorage

### Проблема
Приложение использовало localStorage для кэширования запросов TRPC, что могло приводить к проблемам с устаревшими данными и необходимости ручной очистки кэша.

### Решение
1. Удалено использование `createSyncStoragePersister` из `@tanstack/query-sync-storage-persister`
2. Заменен `PersistQueryClientProvider` на стандартный `QueryClientProvider` из `@tanstack/react-query`
3. Удален объект `mockStorage`, который использовался для SSR совместимости
4. Удалено создание персистера с использованием localStorage

### Обоснование
- Удаление кэширования в localStorage позволяет всегда получать актуальные данные с сервера
- Упрощает кодовую базу, удаляя неиспользуемый код
- Устраняет необходимость ручной очистки кэша пользователем через кнопку в интерфейсе

### Влияние
- Приложение теперь всегда получает свежие данные с сервера
- Данные больше не сохраняются между сессиями в localStorage
- Может быть небольшое увеличение количества запросов к серверу

### Тестирование
Приложение было протестировано и работает корректно после внесенных изменений.