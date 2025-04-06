# Архитектура Local-First для приложения Worthy

## Общая архитектура

```mermaid
graph TD
    UI[Пользовательский интерфейс] --> |Взаимодействие| Hooks[React Hooks]
    Hooks --> |Запросы данных| LocalDB[Локальная БД]
    Hooks --> |Мутации| LocalDB
    LocalDB --> |Синхронизация| SyncQueue[Очередь синхронизации]
    SyncQueue --> |Обработка| SyncProcessor[Процессор синхронизации]
    SyncProcessor --> |API запросы| Server[Сервер]
    Server --> |Ответы| SyncProcessor
    SyncProcessor --> |Обновление| LocalDB
    
    ServiceWorker[Service Worker] --> |Офлайн-синхронизация| SyncQueue
    ServiceWorker --> |Кеширование| StaticCache[Кеш статических ресурсов]
    ServiceWorker --> |Офлайн-доступ| UI
    
    ReactQuery[React Query] --> |Кеширование в памяти| Hooks
    
    subgraph "Клиент"
        UI
        Hooks
        LocalDB
        SyncQueue
        SyncProcessor
        ServiceWorker
        StaticCache
        ReactQuery
    end
    
    subgraph "Сервер"
        Server
        ServerDB[Серверная БД]
        Server --> ServerDB
    end
```

## Поток данных при создании транзакции

```mermaid
sequenceDiagram
    participant User as Пользователь
    participant UI as Интерфейс
    participant Hook as useTransactions
    participant LocalDB as IndexedDB
    participant SyncQ as Очередь синхронизации
    participant SW as Service Worker
    participant Server as API Сервер
    
    User->>UI: Создает транзакцию
    UI->>Hook: Вызывает create()
    Hook->>LocalDB: Сохраняет с временным ID
    LocalDB-->>Hook: Возвращает ID
    Hook->>SyncQ: Добавляет в очередь синхронизации
    Hook-->>UI: Обновляет UI с локальными данными
    
    alt Есть подключение к интернету
        SyncQ->>Server: Отправляет на сервер
        Server-->>SyncQ: Возвращает постоянный ID
        SyncQ->>LocalDB: Обновляет ID в локальной БД
    else Нет подключения
        SW->>SyncQ: Регистрирует Background Sync
        Note over SW,SyncQ: Ожидание подключения
        SW->>Server: Синхронизирует при восстановлении соединения
        Server-->>SW: Возвращает постоянный ID
        SW->>LocalDB: Обновляет ID в локальной БД
    end
```

## Поток данных при загрузке транзакций

```mermaid
sequenceDiagram
    participant User as Пользователь
    participant UI as Интерфейс
    participant Hook as useTransactions
    participant LocalDB as IndexedDB
    participant Server as API Сервер
    
    User->>UI: Открывает страницу транзакций
    UI->>Hook: Запрашивает данные
    
    Hook->>LocalDB: Запрашивает локальные данные
    LocalDB-->>Hook: Возвращает локальные данные
    Hook-->>UI: Обновляет UI с локальными данными
    
    alt Есть подключение к интернету
        Hook->>Server: Запрашивает данные с сервера
        Server-->>Hook: Возвращает серверные данные
        Hook->>Hook: Объединяет локальные и серверные данные
        Hook->>LocalDB: Обновляет локальную БД
        Hook-->>UI: Обновляет UI с объединенными данными
    end
```

## Структура хранилищ IndexedDB

```mermaid
classDiagram
    class IndexedDB {
        Database: worthyDB
        Version: 1
    }
    
    class Transactions {
        keyPath: id
        indexes: createdAt, updatedAt, isIncome
    }
    
    class Templates {
        keyPath: id
        indexes: createdAt, updatedAt
    }
    
    class ShoppingSessions {
        keyPath: id
        indexes: createdAt, updatedAt
    }
    
    class SyncQueue {
        keyPath: id
        indexes: createdAt, status, type
    }
    
    class UserSettings {
        keyPath: id
    }
    
    IndexedDB --> Transactions
    IndexedDB --> Templates
    IndexedDB --> ShoppingSessions
    IndexedDB --> SyncQueue
    IndexedDB --> UserSettings
```

## Стратегия разрешения конфликтов

```mermaid
flowchart TD
    Start[Получены локальные и серверные данные] --> Check{Есть конфликты?}
    Check -->|Нет| Merge[Объединить данные]
    Check -->|Да| Strategy{Стратегия разрешения}
    
    Strategy -->|Временная метка| TimeCheck{Какая версия новее?}
    TimeCheck -->|Локальная| UseLocal[Использовать локальную]
    TimeCheck -->|Серверная| UseServer[Использовать серверную]
    
    Strategy -->|Слияние полей| MergeFields[Объединить поля]
    Strategy -->|Требуется ручное разрешение| Manual[Показать пользователю]
    
    UseLocal --> UpdateServer[Обновить на сервере]
    UseServer --> UpdateLocal[Обновить локально]
    MergeFields --> UpdateBoth[Обновить обе версии]
    Manual --> UserChoice{Выбор пользователя}
    
    UserChoice -->|Локальная| UseLocal
    UserChoice -->|Серверная| UseServer
    UserChoice -->|Объединить| MergeFields
    
    UpdateServer --> Finish[Завершить синхронизацию]
    UpdateLocal --> Finish
    UpdateBoth --> Finish
    Merge --> Finish
```

## Интеграция с существующей архитектурой

```mermaid
graph TD
    subgraph "Существующая архитектура"
        NextJS[Next.js App Router]
        TRPC[tRPC API]
        ReactQuery[React Query]
        Drizzle[Drizzle ORM]
        DB[База данных]
        
        NextJS --> TRPC
        TRPC --> Drizzle
        Drizzle --> DB
        NextJS --> ReactQuery
        ReactQuery --> TRPC
    end
    
    subgraph "Local-First компоненты"
        LocalDB[IndexedDB]
        SyncQueue[Очередь синхронизации]
        ServiceWorker[Service Worker]
        LocalHooks[Local-First Hooks]
        
        LocalHooks --> LocalDB
        LocalDB --> SyncQueue
        SyncQueue --> ServiceWorker
        ServiceWorker --> TRPC
    end
    
    NextJS --> LocalHooks
    LocalHooks --> ReactQuery
```

Эти диаграммы наглядно демонстрируют архитектуру local-first подхода и его интеграцию с существующей системой. Такой подход обеспечит отличный пользовательский опыт даже при нестабильном интернет-соединении, сохраняя при этом все преимущества серверной синхронизации данных.