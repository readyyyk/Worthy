# Подход Local-First для приложения Worthy

## Обзор

Local-first подход означает, что приложение в первую очередь работает с локальными данными, а затем синхронизирует их с сервером. Это обеспечивает:

1. **Мгновенный отклик UI** - пользователи видят результаты своих действий немедленно
2. **Офлайн-доступность** - приложение работает даже без подключения к интернету
3. **Устойчивость к проблемам сети** - временные проблемы с соединением не влияют на работу пользователя
4. **Снижение нагрузки на сервер** - многие операции выполняются локально

## Архитектура Local-First

### 1. Хранение данных

Для реализации local-first подхода мы будем использовать IndexedDB как основное хранилище данных на клиенте:

```typescript
// src/lib/localDB.ts
import { initDB, saveToIndexedDB, getFromIndexedDB, removeFromIndexedDB } from './indexedDB';

// Хранилища для разных типов данных
export const STORES = {
  TRANSACTIONS: 'transactions',
  TEMPLATES: 'templates',
  SHOPPING_SESSIONS: 'shoppingSessions',
  USER_SETTINGS: 'userSettings',
  SYNC_QUEUE: 'syncQueue',
};

// Инициализация базы данных с нужными хранилищами
export const initLocalDB = async (): Promise<IDBDatabase> => {
  const db = await initDB();
  return db;
};

// Функции для работы с транзакциями
export const saveTransaction = async (transaction: any): Promise<string> => {
  // Генерируем локальный ID, если его нет
  if (!transaction.id) {
    transaction.id = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Добавляем метку времени
  transaction.updatedAt = new Date().toISOString();
  
  // Сохраняем транзакцию локально
  await saveToIndexedDB(STORES.TRANSACTIONS, transaction);
  
  // Добавляем в очередь синхронизации
  await addToSyncQueue({
    type: 'transaction',
    action: transaction.id.startsWith('local_') ? 'create' : 'update',
    data: transaction,
    id: transaction.id,
  });
  
  return transaction.id;
};

// Функция для получения транзакций
export const getTransactions = async (): Promise<any[]> => {
  const transactions = await getFromIndexedDB(STORES.TRANSACTIONS);
  return Array.isArray(transactions) ? transactions : [];
};

// Функция для добавления операции в очередь синхронизации
export const addToSyncQueue = async (operation: {
  type: string;
  action: 'create' | 'update' | 'delete';
  data: any;
  id: string;
}): Promise<void> => {
  const queueItem = {
    id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    operation,
    createdAt: new Date().toISOString(),
    attempts: 0,
    status: 'pending',
  };
  
  await saveToIndexedDB(STORES.SYNC_QUEUE, queueItem);
  
  // Запускаем синхронизацию, если есть подключение к интернету
  if (navigator.onLine) {
    void processSyncQueue();
  }
};

// Функция для обработки очереди синхронизации
export const processSyncQueue = async (): Promise<void> => {
  if (!navigator.onLine) return;
  
  const queue = await getFromIndexedDB(STORES.SYNC_QUEUE);
  if (!Array.isArray(queue) || queue.length === 0) return;
  
  // Сортируем по времени создания
  const sortedQueue = [...queue].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  
  for (const item of sortedQueue) {
    if (item.status !== 'pending') continue;
    
    try {
      // Обновляем статус
      item.status = 'processing';
      item.attempts += 1;
      await saveToIndexedDB(STORES.SYNC_QUEUE, item);
      
      // Выполняем операцию на сервере
      await syncItemWithServer(item);
      
      // Если успешно, удаляем из очереди
      await removeFromIndexedDB(STORES.SYNC_QUEUE, item.id);
    } catch (error) {
      console.error('Ошибка синхронизации:', error);
      
      // Обновляем статус и увеличиваем счетчик попыток
      item.status = 'failed';
      await saveToIndexedDB(STORES.SYNC_QUEUE, item);
      
      // Если превышено количество попыток, помечаем как требующее ручного разрешения
      if (item.attempts >= 5) {
        item.status = 'manual_resolution_required';
        await saveToIndexedDB(STORES.SYNC_QUEUE, item);
      }
    }
  }
};

// Функция для синхронизации элемента с сервером
const syncItemWithServer = async (queueItem: any): Promise<void> => {
  const { operation } = queueItem;
  
  // Определяем URL и метод в зависимости от типа операции
  let url = '';
  let method = 'POST';
  
  switch (operation.type) {
    case 'transaction':
      url = '/api/trpc/transactions.';
      break;
    case 'template':
      url = '/api/trpc/templates.';
      break;
    case 'shoppingSession':
      url = '/api/trpc/shoppingSessions.';
      break;
    default:
      throw new Error(`Неизвестный тип операции: ${operation.type}`);
  }
  
  switch (operation.action) {
    case 'create':
      url += 'create';
      method = 'POST';
      break;
    case 'update':
      url += 'update';
      method = 'POST';
      break;
    case 'delete':
      url += 'delete';
      method = 'POST';
      break;
    default:
      throw new Error(`Неизвестное действие: ${operation.action}`);
  }
  
  // Отправляем запрос на сервер
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(operation.data),
  });
  
  if (!response.ok) {
    throw new Error(`Ошибка синхронизации: ${response.status} ${response.statusText}`);
  }
  
  // Если это была операция создания, обновляем локальный ID на серверный
  if (operation.action === 'create') {
    const result = await response.json();
    if (result.id && operation.data.id.startsWith('local_')) {
      // Получаем объект из локального хранилища
      const localItem = await getFromIndexedDB(
        getStoreNameByType(operation.type),
        operation.data.id
      );
      
      if (localItem) {
        // Удаляем старую запись с локальным ID
        await removeFromIndexedDB(getStoreNameByType(operation.type), operation.data.id);
        
        // Создаем новую запись с серверным ID
        const updatedItem = { ...localItem, id: result.id };
        await saveToIndexedDB(getStoreNameByType(operation.type), updatedItem);
      }
    }
  }
};

// Вспомогательная функция для определения имени хранилища по типу
const getStoreNameByType = (type: string): string => {
  switch (type) {
    case 'transaction':
      return STORES.TRANSACTIONS;
    case 'template':
      return STORES.TEMPLATES;
    case 'shoppingSession':
      return STORES.SHOPPING_SESSIONS;
    default:
      throw new Error(`Неизвестный тип: ${type}`);
  }
};

// Настройка обработчиков событий для синхронизации
export const setupSyncEventListeners = (): void => {
  // Синхронизация при восстановлении соединения
  window.addEventListener('online', () => {
    void processSyncQueue();
  });
  
  // Регистрация Background Sync, если поддерживается
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then(registration => {
      registration.sync.register('sync-data')
        .catch(error => console.error('Ошибка регистрации синхронизации:', error));
    });
  }
};
```

### 2. Интеграция с React Query

Для интеграции local-first подхода с React Query мы модифицируем наши хуки:

```typescript
// src/hooks/useLocalFirst.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTransactions, saveTransaction, getFromIndexedDB, STORES } from '@/lib/localDB';
import { api } from '@/trpc/react';

// Хук для получения транзакций с local-first подходом
export const useTransactions = () => {
  const queryClient = useQueryClient();
  
  // Запрос к локальной базе данных
  const localQuery = useQuery({
    queryKey: ['transactions', 'local'],
    queryFn: getTransactions,
    staleTime: 30 * 1000, // 30 секунд
  });
  
  // Запрос к серверу (выполняется после получения локальных данных)
  const serverQuery = api.transactions.getAll.useQuery(undefined, {
    enabled: localQuery.isSuccess, // Запускаем только после получения локальных данных
    staleTime: 60 * 1000, // 1 минута
    onSuccess: (serverData) => {
      // Объединяем локальные и серверные данные
      mergeTransactions(localQuery.data || [], serverData);
    },
  });
  
  // Мутация для создания транзакции
  const createMutation = useMutation({
    mutationFn: saveTransaction,
    onSuccess: () => {
      // Инвалидируем кеш локальных транзакций
      queryClient.invalidateQueries({ queryKey: ['transactions', 'local'] });
    },
  });
  
  return {
    // Возвращаем локальные данные, если они есть, иначе пустой массив
    data: localQuery.data || [],
    isLoading: localQuery.isLoading,
    isError: localQuery.isError || serverQuery.isError,
    error: localQuery.error || serverQuery.error,
    create: createMutation.mutate,
    isCreating: createMutation.isPending,
  };
};

// Функция для объединения локальных и серверных данных
const mergeTransactions = async (localTransactions: any[], serverTransactions: any[]) => {
  // Создаем Map для быстрого поиска
  const localMap = new Map(localTransactions.map(t => [t.id, t]));
  const serverMap = new Map(serverTransactions.map(t => [t.id, t]));
  
  // Находим транзакции, которые есть на сервере, но нет локально
  const newServerTransactions = serverTransactions.filter(t => !localMap.has(t.id));
  
  // Находим транзакции, которые нужно обновить локально
  const toUpdate = serverTransactions.filter(serverTx => {
    const localTx = localMap.get(serverTx.id);
    if (!localTx) return false;
    
    // Сравниваем по времени обновления
    const serverTime = new Date(serverTx.updatedAt).getTime();
    const localTime = new Date(localTx.updatedAt).getTime();
    
    return serverTime > localTime;
  });
  
  // Сохраняем новые и обновленные транзакции локально
  for (const tx of [...newServerTransactions, ...toUpdate]) {
    await saveToIndexedDB(STORES.TRANSACTIONS, tx);
  }
  
  // Находим локальные транзакции с временными ID, которые еще не синхронизированы
  const localOnly = localTransactions.filter(t => t.id.startsWith('local_'));
  
  // Возвращаем объединенные данные
  return [...serverTransactions, ...localOnly];
};
```

### 3. Модификация Service Worker

Обновляем Service Worker для поддержки Background Sync:

```javascript
// public/sw.js (дополнение)

// Обработчик события синхронизации
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

// Функция для синхронизации данных
async function syncData() {
  try {
    // Открываем базу данных
    const db = await openDB();
    
    // Получаем элементы из очереди синхронизации
    const syncQueue = await getAllFromStore(db, 'syncQueue');
    
    if (!syncQueue || syncQueue.length === 0) {
      return;
    }
    
    // Сортируем по времени создания
    const sortedQueue = [...syncQueue].sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    
    for (const item of sortedQueue) {
      if (item.status !== 'pending' && item.status !== 'failed') continue;
      
      try {
        // Обновляем статус
        item.status = 'processing';
        item.attempts += 1;
        await updateInStore(db, 'syncQueue', item);
        
        // Выполняем операцию на сервере
        await syncItemWithServer(item);
        
        // Если успешно, удаляем из очереди
        await deleteFromStore(db, 'syncQueue', item.id);
      } catch (error) {
        console.error('Ошибка синхронизации в Service Worker:', error);
        
        // Обновляем статус
        item.status = 'failed';
        await updateInStore(db, 'syncQueue', item);
        
        // Если превышено количество попыток, помечаем как требующее ручного разрешения
        if (item.attempts >= 5) {
          item.status = 'manual_resolution_required';
          await updateInStore(db, 'syncQueue', item);
        }
      }
    }
  } catch (error) {
    console.error('Ошибка синхронизации данных:', error);
  }
}

// Вспомогательные функции для работы с IndexedDB в Service Worker
async function getAllFromStore(db, storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.getAll();
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function updateInStore(db, storeName, item) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(item);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function deleteFromStore(db, storeName, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.delete(id);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Функция для синхронизации элемента с сервером (аналогична клиентской версии)
async function syncItemWithServer(queueItem) {
  const { operation } = queueItem;
  
  // Определяем URL и метод в зависимости от типа операции
  let url = '';
  let method = 'POST';
  
  switch (operation.type) {
    case 'transaction':
      url = '/api/trpc/transactions.';
      break;
    case 'template':
      url = '/api/trpc/templates.';
      break;
    case 'shoppingSession':
      url = '/api/trpc/shoppingSessions.';
      break;
    default:
      throw new Error(`Неизвестный тип операции: ${operation.type}`);
  }
  
  switch (operation.action) {
    case 'create':
      url += 'create';
      method = 'POST';
      break;
    case 'update':
      url += 'update';
      method = 'POST';
      break;
    case 'delete':
      url += 'delete';
      method = 'POST';
      break;
    default:
      throw new Error(`Неизвестное действие: ${operation.action}`);
  }
  
  // Отправляем запрос на сервер
  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(operation.data),
  });
  
  if (!response.ok) {
    throw new Error(`Ошибка синхронизации: ${response.status} ${response.statusText}`);
  }
  
  // Если это была операция создания, обновляем локальный ID на серверный
  if (operation.action === 'create') {
    const result = await response.json();
    if (result.id && operation.data.id.startsWith('local_')) {
      // Получаем объект из локального хранилища
      const db = await openDB();
      const storeName = getStoreNameByType(operation.type);
      
      const localItem = await getFromStore(db, storeName, operation.data.id);
      
      if (localItem) {
        // Удаляем старую запись с локальным ID
        await deleteFromStore(db, storeName, operation.data.id);
        
        // Создаем новую запись с серверным ID
        const updatedItem = { ...localItem, id: result.id };
        await updateInStore(db, storeName, updatedItem);
      }
    }
  }
}

// Вспомогательная функция для получения элемента из хранилища
async function getFromStore(db, storeName, id) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(id);
    
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Вспомогательная функция для определения имени хранилища по типу
function getStoreNameByType(type) {
  switch (type) {
    case 'transaction':
      return 'transactions';
    case 'template':
      return 'templates';
    case 'shoppingSession':
      return 'shoppingSessions';
    default:
      throw new Error(`Неизвестный тип: ${type}`);
  }
}
```

### 4. Модификация tRPC клиента

Обновляем tRPC клиент для интеграции с local-first подходом:

```typescript
// src/trpc/react.tsx (модификация)
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { loggerLink, unstable_httpBatchStreamLink } from '@trpc/client';
import { createTRPCReact } from '@trpc/react-query';

import { type ReactNode, useState, useEffect } from 'react';

import { type AppRouter } from '@/server/api/root';
import { getUrl, transformer } from './shared';
import { CACHE_CONFIG } from '@/lib/persistQueryClient';
import { registerServiceWorker } from '@/lib/serviceWorker';
import { setupSyncEventListeners } from '@/lib/localDB';

export const api = createTRPCReact<AppRouter>();

export function TRPCReactProvider(props: { children: ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                retry: 1,
                refetchOnMount: false,
                refetchOnWindowFocus: false,
                staleTime: CACHE_CONFIG.default.staleTime,
                cacheTime: CACHE_CONFIG.default.cacheTime,
            },
        },
    }));

    // Настраиваем персистентное хранение кеша и local-first функциональность
    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Регистрируем Service Worker для PWA
            registerServiceWorker();
            
            // Настраиваем обработчики событий для синхронизации
            setupSyncEventListeners();
        }
    }, []);

    const [trpcClient] = useState(() =>
        api.createClient({
            transformer,
            links: [
                loggerLink({
                    enabled: (op) =>
                        process.env.NODE_ENV === 'development' ||
                        (op.direction === 'down' && op.result instanceof Error),
                }),
                unstable_httpBatchStreamLink({
                    url: getUrl(),
                }),
            ],
        }),
    );

    return (
        <QueryClientProvider client={queryClient}>
            <api.Provider client={trpcClient} queryClient={queryClient}>
                {props.children}
            </api.Provider>
        </QueryClientProvider>
    );
}
```

## Преимущества Local-First подхода

1. **Улучшенный пользовательский опыт**:
   - Мгновенный отклик UI на действия пользователя
   - Работа приложения даже при отсутствии интернета
   - Бесшовная синхронизация при восстановлении соединения

2. **Технические преимущества**:
   - Снижение нагрузки на сервер
   - Уменьшение количества запросов к API
   - Повышение устойчивости к проблемам сети
   - Улучшение производительности приложения

3. **Бизнес-преимущества**:
   - Повышение удержания пользователей благодаря лучшему UX
   - Возможность работы в условиях нестабильного интернета
   - Снижение затрат на серверную инфраструктуру

## Потенциальные проблемы и их решения

1. **Конфликты синхронизации**:
   - Реализация стратегии разрешения конфликтов на основе временных меток
   - Возможность ручного разрешения сложных конфликтов

2. **Управление хранилищем**:
   - Ограничение размера локального хранилища
   - Автоматическая очистка устаревших данных

3. **Безопасность данных**:
   - Шифрование чувствительных данных в локальном хранилище
   - Проверка целостности данных

## Заключение

Реализация local-first подхода значительно улучшит пользовательский опыт в приложении Worthy, обеспечивая быструю работу и доступность даже при отсутствии интернета. Этот подход особенно полезен для приложения по управлению финансами, где важна надежность и доступность данных в любых условиях.