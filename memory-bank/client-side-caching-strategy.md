# Комплексная стратегия кеширования на стороне клиента

## Обзор

Данный документ описывает комплексную стратегию кеширования на стороне клиента для приложения Worthy, которая оптимизирует производительность, снижает нагрузку на сервер и улучшает пользовательский опыт. Стратегия включает в себя:

1. **Механизмы хранения в браузере** (localStorage, sessionStorage, IndexedDB)
2. **Политики HTTP-кеширования** с соответствующими заголовками cache-control
3. **Реализацию Service Worker** для офлайн-возможностей
4. **Стратегии инвалидации кеша**
5. **Подходы к управлению памятью**
6. **Соображения безопасности**

## 1. Механизмы хранения в браузере

### 1.1 React Query (Оперативные данные)

React Query уже используется в приложении и является основным механизмом кеширования данных API. Текущая конфигурация имеет `staleTime: Infinity` и `cacheTime: Infinity`, что может быть оптимизировано:

```typescript
// src/trpc/react.tsx
const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnMount: false,
            refetchOnWindowFocus: false,
            // Дифференцированные настройки staleTime в зависимости от типа данных
            staleTime: 5 * 60 * 1000, // 5 минут по умолчанию
            cacheTime: 30 * 60 * 1000, // 30 минут по умолчанию
        },
    },
}));
```

### 1.2 Персистентное кеширование с IndexedDB

Для персистентного хранения данных между сессиями рекомендуется использовать IndexedDB вместо localStorage из-за большего объема хранения и асинхронной природы:

```typescript
// src/lib/indexedDB.ts
export const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('worthyDB', 1);
    
    request.onerror = (event) => {
      reject('Ошибка открытия базы данных');
    };
    
    request.onsuccess = (event) => {
      const db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = request.result;
      
      // Хранилище для кешированных транзакций
      if (!db.objectStoreNames.contains('transactions')) {
        db.createObjectStore('transactions', { keyPath: 'id' });
      }
      
      // Хранилище для пользовательских настроек
      if (!db.objectStoreNames.contains('userSettings')) {
        db.createObjectStore('userSettings', { keyPath: 'id' });
      }
      
      // Хранилище для шаблонов
      if (!db.objectStoreNames.contains('templates')) {
        db.createObjectStore('templates', { keyPath: 'id' });
      }
    };
  });
};

// Сохранение данных
export const saveToIndexedDB = (storeName, data) => {
  return new Promise((resolve, reject) => {
    initDB().then((db) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const request = Array.isArray(data)
        ? Promise.all(data.map(item => store.put(item)))
        : store.put(data);
      
      transaction.oncomplete = () => resolve(true);
      transaction.onerror = () => reject('Ошибка сохранения данных');
    });
  });
};

// Получение данных
export const getFromIndexedDB = (storeName, key) => {
  return new Promise((resolve, reject) => {
    initDB().then((db) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      
      const request = key ? store.get(key) : store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject('Ошибка получения данных');
    });
  });
};

// Удаление данных
export const removeFromIndexedDB = (storeName, key) => {
  return new Promise((resolve, reject) => {
    initDB().then((db) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const request = store.delete(key);
      
      request.onsuccess = () => resolve(true);
      request.onerror = () => reject('Ошибка удаления данных');
    });
  });
};
```

### 1.3 Интеграция React Query с IndexedDB

Для персистентного хранения кеша React Query между сессиями:

```typescript
// src/lib/persistQueryClient.ts
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { QueryClient } from '@tanstack/react-query';
import { saveToIndexedDB, getFromIndexedDB } from './indexedDB';

// Создаем персистер для IndexedDB
const createIndexedDBPersister = () => {
  return {
    persistClient: async (client) => {
      const clientData = JSON.stringify(client);
      await saveToIndexedDB('queryCache', { id: 'queryCache', data: clientData });
    },
    restoreClient: async () => {
      const cacheData = await getFromIndexedDB('queryCache', 'queryCache');
      if (!cacheData) return;
      return JSON.parse(cacheData.data);
    },
    removeClient: async () => {
      await removeFromIndexedDB('queryCache', 'queryCache');
    },
  };
};

// Функция для настройки персистентного кеша
export const setupPersistentQueryClient = (queryClient: QueryClient) => {
  // Для браузеров, не поддерживающих IndexedDB, используем localStorage
  const isIndexedDBAvailable = typeof indexedDB !== 'undefined';
  
  if (isIndexedDBAvailable) {
    persistQueryClient({
      queryClient,
      persister: createIndexedDBPersister(),
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
      buster: 'v1', // Версия кеша, изменение сбросит кеш
    });
  } else {
    // Фолбэк на localStorage
    const localStoragePersister = createSyncStoragePersister({
      storage: typeof window !== 'undefined' ? window.localStorage : null,
    });
    
    persistQueryClient({
      queryClient,
      persister: localStoragePersister,
      maxAge: 24 * 60 * 60 * 1000, // 1 день для localStorage (меньше из-за ограничений)
      buster: 'v1',
    });
  }
};
```

### 1.4 Использование sessionStorage для временных данных

Для временных данных, которые должны быть доступны только в рамках текущей сессии:

```typescript
// src/lib/sessionStorage.ts
export const saveToSessionStorage = (key, data) => {
  try {
    sessionStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Ошибка сохранения в sessionStorage:', error);
    return false;
  }
};

export const getFromSessionStorage = (key) => {
  try {
    const data = sessionStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Ошибка получения из sessionStorage:', error);
    return null;
  }
};

export const removeFromSessionStorage = (key) => {
  try {
    sessionStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error('Ошибка удаления из sessionStorage:', error);
    return false;
  }
};
```

## 2. HTTP-кеширование

### 2.1 Настройка заголовков Cache-Control

Для оптимизации HTTP-кеширования необходимо настроить соответствующие заголовки Cache-Control в зависимости от типа ресурса:

```typescript
// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  // Аутентификация
  const token = await getToken({ req: request });
  const isAuthenticated = !!token;
  
  // Получаем путь запроса
  const path = request.nextUrl.pathname;
  
  // Клонируем ответ для модификации
  const response = NextResponse.next();
  
  // Настройка кеширования для статических ресурсов
  if (path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
    // Статические ресурсы кешируются на длительное время
    response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
  }
  // Настройка кеширования для API
  else if (path.startsWith('/api/trpc')) {
    if (isAuthenticated) {
      // Приватные данные не должны кешироваться общими кешами
      response.headers.set('Cache-Control', 'private, max-age=0, must-revalidate');
    } else {
      // Публичные API могут кешироваться, но с проверкой свежести
      response.headers.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
    }
  }
  // Настройка кеширования для HTML страниц
  else if (!path.startsWith('/_next/')) {
    // HTML страницы не должны кешироваться браузером
    response.headers.set('Cache-Control', 'no-store, must-revalidate');
  }
  
  return response;
}

// Обновляем конфигурацию middleware
export const config = {
  matcher: [
    '/',
    '/transactions',
    '/new',
    '/me',
    '/api/trpc/:path*',
    '/_next/static/:path*',
    '/static/:path*',
    '/:path*.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)',
  ],
};
```

## 3. Service Worker для офлайн-возможностей

### 3.1 Базовая реализация Service Worker

```typescript
// public/sw.js
const CACHE_NAME = 'worthy-cache-v1';
const OFFLINE_PAGE = '/offline.html';

// Ресурсы для предварительного кеширования
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/favicon.ico',
  '/logo-192.png',
  '/logo-384.png',
  '/logo-512.png',
  '/logo.svg',
  '/static/css/main.css',
  '/static/js/main.js',
];

// Установка Service Worker
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        // Предварительное кеширование важных ресурсов
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => self.skipWaiting())
  );
});

// Активация Service Worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName !== CACHE_NAME)
          .map((cacheName) => caches.delete(cacheName))
      );
    }).then(() => self.clients.claim())
  );
});

// Стратегия кеширования: Network First с фолбэком на кеш
self.addEventListener('fetch', (event) => {
  // Пропускаем запросы к API через сеть
  if (event.request.url.includes('/api/')) {
    return;
  }
  
  // Для остальных запросов используем стратегию Network First
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Если получили успешный ответ, кешируем его
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // При ошибке сети пытаемся получить из кеша
        return caches.match(event.request)
          .then((cachedResponse) => {
            // Если есть в кеше, возвращаем из кеша
            if (cachedResponse) {
              return cachedResponse;
            }
            
            // Если нет в кеше и это запрос HTML страницы, показываем офлайн-страницу
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match(OFFLINE_PAGE);
            }
            
            // Для других ресурсов возвращаем ошибку
            return new Response('Network error', { status: 408, headers: { 'Content-Type': 'text/plain' } });
          });
      })
  );
});

// Синхронизация данных при восстановлении соединения
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-transactions') {
    event.waitUntil(syncTransactions());
  }
});

// Функция для синхронизации транзакций
async function syncTransactions() {
  try {
    // Получаем неотправленные транзакции из IndexedDB
    const db = await openDB();
    const pendingTransactions = await db.getAll('pendingTransactions');
    
    // Отправляем каждую транзакцию на сервер
    for (const transaction of pendingTransactions) {
      const response = await fetch('/api/trpc/transactions.create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transaction),
      });
      
      if (response.ok) {
        // Если успешно отправлено, удаляем из очереди
        await db.delete('pendingTransactions', transaction.id);
      }
    }
  } catch (error) {
    console.error('Ошибка синхронизации транзакций:', error);
  }
}

// Функция для открытия IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('worthyDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = request.result;
      if (!db.objectStoreNames.contains('pendingTransactions')) {
        db.createObjectStore('pendingTransactions', { keyPath: 'id' });
      }
    };
  });
}
```

### 3.2 Регистрация Service Worker

```typescript
// src/lib/serviceWorker.ts
export const registerServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('ServiceWorker зарегистрирован успешно:', registration.scope);
        })
        .catch((error) => {
          console.error('Ошибка регистрации ServiceWorker:', error);
        });
    });
  }
};

// Функция для запроса синхронизации данных
export const requestSync = () => {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.sync.register('sync-transactions')
        .catch((error) => {
          console.error('Ошибка регистрации синхронизации:', error);
        });
    });
  }
};
```

### 3.3 Интеграция в приложение

```typescript
// src/app/layout.tsx
import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/serviceWorker';

const RootLayout = ({ children }: { children: ReactNode }) => {
  useEffect(() => {
    // Регистрируем Service Worker только на клиенте
    if (typeof window !== 'undefined') {
      registerServiceWorker();
    }
  }, []);

  return (
    <html lang="en">
    <body className={`font-sans ${font.variable} dark p-3 pb-20`}>
    <TRPCReactProvider>
        <NextAuthProvider>
            {children}
            <Header />
        </NextAuthProvider>
    </TRPCReactProvider>
    </body>
    </html>
  );
};
```

## 4. Стратегии инвалидации кеша

### 4.1 Инвалидация по времени

React Query уже предоставляет механизм инвалидации по времени через `staleTime`. Для разных типов данных можно настроить разные значения:

```typescript
// Конфигурация для разных типов данных
const CACHE_CONFIG = {
  transactions: {
    staleTime: 60 * 1000, // 1 минута
    cacheTime: 5 * 60 * 1000, // 5 минут
  },
  templates: {
    staleTime: 24 * 60 * 60 * 1000, // 24 часа
    cacheTime: 7 * 24 * 60 * 60 * 1000, // 7 дней
  },
  userSettings: {
    staleTime: 30 * 60 * 1000, // 30 минут
    cacheTime: 24 * 60 * 60 * 1000, // 24 часа
  },
};
```

### 4.2 Инвалидация по действию

При выполнении мутаций (создание, обновление, удаление) необходимо инвалидировать соответствующие запросы:

```typescript
// src/app/transactions/create-session-dialog.tsx
const createSessionMutation = api.shoppingSessions.create.useMutation({
  onSuccess: () => {
    // Инвалидируем запросы, связанные с сессиями покупок
    queryClient.invalidateQueries({ queryKey: ['shoppingSessions'] });
    // Также инвалидируем связанные запросы
    queryClient.invalidateQueries({ queryKey: ['transactions'] });
  },
});
```

### 4.3 Инвалидация по версии

Для глобальной инвалидации кеша при обновлении приложения:

```typescript
// src/lib/persistQueryClient.ts
const APP_VERSION = 'v1.0.0'; // Обновляется при выпуске новой версии

export const setupPersistentQueryClient = (queryClient: QueryClient) => {
  persistQueryClient({
    queryClient,
    persister: createIndexedDBPersister(),
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 дней
    buster: APP_VERSION, // Изменение версии сбросит кеш
  });
};
```

### 4.4 Ручная инвалидация

Предоставление пользователю возможности вручную обновить данные:

```typescript
// src/app/transactions/page.tsx
const { data, refetch, isRefetching } = api.transactions.getAll.useQuery();

// Компонент кнопки обновления
const RefreshButton = () => (
  <button
    onClick={() => refetch()}
    disabled={isRefetching}
    className="p-2 rounded-full hover:bg-gray-700"
  >
    <RefreshIcon className={`w-5 h-5 ${isRefetching ? 'animate-spin' : ''}`} />
  </button>
);
```

## 5. Управление памятью

### 5.1 Ограничение размера кеша

```typescript
// src/trpc/react.tsx
const [queryClient] = useState(() => new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
      cacheTime: 30 * 60 * 1000,
      // Ограничение количества запросов в кеше
      gcTime: 30 * 60 * 1000, // Время до сборки мусора
    },
  },
}));
```

### 5.2 Мониторинг использования памяти

```typescript
// src/lib/memoryMonitor.ts
export const monitorMemoryUsage = () => {
  if ('performance' in window && 'memory' in performance) {
    const memory = (performance as any).memory;
    
    // Если использование памяти превышает порог, очищаем кеш
    if (memory.usedJSHeapSize > memory.jsHeapSizeLimit * 0.8) {
      console.warn('Высокое использование памяти, очищаем кеш...');
      
      // Очистка кеша React Query
      const queryClient = useQueryClient();
      queryClient.clear();
      
      // Очистка неиспользуемых данных в IndexedDB
      cleanupIndexedDB();
    }
  }
};

// Функция для очистки старых данных в IndexedDB
const cleanupIndexedDB = async () => {
  try {
    const db = await initDB();
    const transaction = db.transaction(['transactions', 'templates'], 'readwrite');
    
    // Удаляем старые транзакции (старше 30 дней)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const transactionsStore = transaction.objectStore('transactions');
    const allTransactions = await transactionsStore.getAll();
    
    allTransactions
      .filter(tx => new Date(tx.createdAt) < thirtyDaysAgo)
      .forEach(tx => transactionsStore.delete(tx.id));
      
    console.log('Очистка IndexedDB завершена');
  } catch (error) {
    console.error('Ошибка очистки IndexedDB:', error);
  }
};

// Запускаем мониторинг каждые 5 минут
export const startMemoryMonitoring = () => {
  setInterval(monitorMemoryUsage, 5 * 60 * 1000);
};
```

## 6. Соображения безопасности

### 6.1 Защита чувствительных данных

```typescript
// src/lib/securityUtils.ts
export const isSensitiveData = (data: any): boolean => {
  // Проверяем, содержит ли данные чувствительную информацию
  if (!data) return false;
  
  // Проверка на наличие ключевых слов в ключах объекта
  const sensitiveKeys = ['password', 'token', 'secret', 'credit', 'card', 'cvv', 'ssn', 'social'];
  
  if (typeof data === 'object') {
    return Object.keys(data).some(key =>
      sensitiveKeys.some(sensitiveKey => key.toLowerCase().includes(sensitiveKey))
    );
  }
  
  return false;
};

// Функция для безопасного кеширования данных
export const secureCacheData = (key: string, data: any): any => {
  // Если данные чувствительные, не кешируем их или маскируем
  if (isSensitiveData(data)) {
    // Вариант 1: Не кешировать
    return null;
    
    // Вариант 2: Маскировать чувствительные поля
    // return maskSensitiveData(data);
  }
  
  return data;
};

// Функция для маскирования чувствительных данных
export const maskSensitiveData = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveKeys = ['password', 'token', 'secret', 'credit', 'card', 'cvv', 'ssn', 'social'];
  const result = { ...data };
  
  Object.keys(result).forEach(key => {
    if (sensitiveKeys.some(sensitiveKey => key.toLowerCase().includes(sensitiveKey))) {
      result[key] = '********';
    } else if (typeof result[key] === 'object') {
      result[key] = maskSensitiveData(result[key]);
    }
  });
  
  return result;
};
```

### 6.2 Очистка кеша при выходе из системы

```typescript
// src/app/_components/NextAuthProvider.tsx
import { signOut } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { removeFromIndexedDB } from '@/lib/indexedDB';

// Расширенная функция выхода из системы
export const secureSignOut = async () => {
  // Очищаем кеш React Query
  const queryClient = useQueryClient();
  queryClient.clear();
  
  // Очищаем IndexedDB
  try {
    await removeFromIndexedDB('transactions', null);
    await removeFromIndexedDB('templates', null);
    await removeFromIndexedDB('userSettings', null);
    await removeFromIndexedDB('queryCache', 'queryCache');
  } catch (error) {
    console.error('Ошибка очистки IndexedDB при выходе:', error);
  }
  
  // Очищаем sessionStorage
  sessionStorage.clear();
  
  // Выходим из системы
  await signOut();
};
```

### 6.3 Защита от XSS при использовании кеша

```typescript
// src/lib/securityUtils.ts
export const sanitizeDataForCache = (data: any): any => {
  if (!data) return data;
  
  // Для строк
  if (typeof data === 'string') {
    // Простая санитизация HTML
    return data
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/`/g, '&#96;')
      .replace(/\$/g, '&#36;');
  }
  
  // Для массивов
  if (Array.isArray(data)) {
    return data.map(item => sanitizeDataForCache(item));
  }
  
  // Для объектов
  if (typeof data === 'object') {
    const result = {};
    Object.keys(data).forEach(key => {
      result[key] = sanitizeDataForCache(data[key]);
    });
    return result;
  }
  
  // Для других типов данных
  return data;
};
```

### 6.4 Проверка целостности кешированных данных

```typescript
// src/lib/cacheIntegrity.ts
import { createHash } from 'crypto';

// Функция для создания хеша данных
export const createDataHash = (data: any): string => {
  const hash = createHash('sha256');
  hash.update(JSON.stringify(data));
  return hash.digest('hex');
};

// Функция для сохранения данных с хешем
export const saveWithIntegrityCheck = (storeName: string, data: any) => {
  const dataHash = createDataHash(data);
  
  // Сохраняем данные вместе с хешем
  return saveToIndexedDB(storeName, {
    ...data,
    _integrity: dataHash,
  });
};

// Функция для проверки целостности данных
export const verifyDataIntegrity = (data: any): boolean => {
  if (!data || !data._integrity) return false;
  
  // Создаем копию данных без поля _integrity
  const { _integrity, ...dataWithoutHash } = data;
  
  // Вычисляем хеш данных
  const computedHash = createDataHash(dataWithoutHash);
  
  // Сравниваем хеши
  return _integrity === computedHash;
};

// Функция для получения данных с проверкой целостности
export const getWithIntegrityCheck = async (storeName: string, key: any) => {
  const data = await getFromIndexedDB(storeName, key);
  
  // Если данные не найдены
  if (!data) return null;
  
  // Проверяем целостность данных
  if (!verifyDataIntegrity(data)) {
    console.error('Нарушена целостность кешированных данных');
    // Удаляем поврежденные данные
    await removeFromIndexedDB(storeName, key);
    return null;
  }
  
  // Удаляем поле _integrity из данных перед возвратом
  const { _integrity, ...dataWithoutHash } = data;
  return dataWithoutHash;
};
```

## 7. Рекомендации по типам ресурсов

### 7.1 API-ответы

Для API-ответов рекомендуется использовать React Query с настройками staleTime и cacheTime в зависимости от типа данных:

```typescript
// Пример использования для разных типов данных
const { data: transactions } = api.transactions.getAll.useQuery(
  undefined,
  CACHE_CONFIG.transactions
);

const { data: templates } = api.templates.getAll.useQuery(
  undefined,
  CACHE_CONFIG.templates
);

const { data: userSettings } = api.users.getSettings.useQuery(
  undefined,
  CACHE_CONFIG.userSettings
);
```

### 7.2 Статические ресурсы

Для статических ресурсов (JS, CSS, изображения) рекомендуется использовать HTTP-кеширование с долгим сроком жизни и Service Worker:

```typescript
// Настройка кеширования для статических ресурсов в middleware.ts
if (path.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
  // Статические ресурсы кешируются на длительное время
  response.headers.set('Cache-Control', 'public, max-age=31536000, immutable');
}
```

### 7.3 Пользовательские данные

Для пользовательских данных рекомендуется использовать IndexedDB с проверкой целостности и защитой чувствительной информации:

```typescript
// Пример сохранения пользовательских настроек
export const saveUserSettings = async (settings) => {
  // Проверяем и маскируем чувствительные данные
  const secureSettings = secureCacheData('userSettings', settings);
  
  // Если данные не чувствительные, сохраняем с проверкой целостности
  if (secureSettings) {
    await saveWithIntegrityCheck('userSettings', secureSettings);
    return true;
  }
  
  return false;
};

// Пример получения пользовательских настроек
export const getUserSettings = async () => {
  // Получаем данные с проверкой целостности
  return await getWithIntegrityCheck('userSettings', 'current');
};
```

## 8. Заключение

Предложенная стратегия кеширования на стороне клиента обеспечивает:

1. **Оптимизацию производительности** за счет кеширования данных на разных уровнях (память, localStorage, IndexedDB, HTTP-кеш, Service Worker)
2. **Снижение нагрузки на сервер** благодаря уменьшению количества повторных запросов
3. **Улучшение пользовательского опыта** через быструю загрузку данных и офлайн-возможности
4. **Безопасность данных** с помощью проверки целостности и защиты чувствительной информации
5. **Эффективное управление памятью** через мониторинг и приоритизацию кешированных данных

Реализация этой стратегии позволит приложению Worthy работать быстрее, надежнее и с лучшим пользовательским опытом, особенно в условиях нестабильного соединения.

### 5.3 Приоритизация данных

```typescript
// src/lib/cacheManager.ts
export const prioritizeCache = async () => {
  try {
    // Получаем все кешированные запросы
    const queryClient = useQueryClient();
    const queries = queryClient.getQueryCache().getAll();
    
    // Сортируем запросы по приоритету
    const prioritizedQueries = queries.sort((a, b) => {
      // Приоритет по типу данных
      const typeA = a.queryKey[0];
      const typeB = b.queryKey[0];
      
      // Транзакции имеют высший приоритет
      if (typeA === 'transactions' && typeB !== 'transactions') return -1;
      if (typeA !== 'transactions' && typeB === 'transactions') return 1;
      
      // Затем идут шаблоны
      if (typeA === 'templates' && typeB !== 'templates') return -1;
      if (typeA !== 'templates' && typeB === 'templates') return 1;
      
      // По умолчанию сортируем по времени последнего использования
      return b.state.dataUpdatedAt - a.state.dataUpdatedAt;
    });
    
    // Если количество запросов превышает лимит, удаляем наименее приоритетные
    const MAX_QUERIES = 100;
    if (prioritizedQueries.length > MAX_QUERIES) {
      prioritizedQueries
        .slice(MAX_QUERIES)
        .forEach(query => queryClient.removeQueries({ queryKey: query.queryKey }));
    }
  } catch (error) {
    console.error('Ошибка приоритизации кеша:', error);
  }
};
```

### 3.4 Создание офлайн-страницы

```html
<!-- public/offline.html -->
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Worthy - Офлайн</title>
  <style>
    body {
      font-family: 'Ubuntu', sans-serif;
      background-color: #030712;
      color: #ffffff;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      padding: 20px;
      text-align: center;
    }
    
    h1 {
      color: #6D28D9;
      margin-bottom: 20px;
    }
    
    p {
      margin-bottom: 30px;
      max-width: 600px;
    }
    
    .logo {
      width: 100px;
      height: 100px;
      margin-bottom: 30px;
    }
    
    .button {
      background-color: #6D28D9;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
    }
    
    .button:hover {
      background-color: #5b21b6;
    }
  </style>
</head>
<body>
  <img src="/logo.svg" alt="Worthy Logo" class="logo">
  <h1>Вы находитесь офлайн</h1>
  <p>К сожалению, вы не подключены к интернету. Некоторые функции приложения могут быть недоступны.</p>
  <p>Вы можете просматривать ранее загруженные данные и создавать новые транзакции, которые будут синхронизированы, когда соединение восстановится.</p>
  <button class="button" onclick="window.location.reload()">Повторить попытку</button>
</body>
</html>
```

### 2.2 Использование ETag и If-None-Match

Для API-запросов, которые не могут быть кешированы длительное время, можно использовать ETag:

```typescript
// src/server/api/trpc.ts
import { createTRPCRouter, publicProcedure, protectedProcedure } from '@/server/api/trpc';
import { createHash } from 'crypto';

// Функция для генерации ETag
const generateETag = (data: any) => {
  const hash = createHash('md5');
  hash.update(JSON.stringify(data));
  return `"${hash.digest('hex')}"`;
};

// Пример использования ETag в процедуре
export const transactionsRouter = createTRPCRouter({
  getAll: protectedProcedure
    .query(async ({ ctx }) => {
      const transactions = await ctx.db.transaction.findMany({
        where: { userId: ctx.session.user.id },
        orderBy: { createdAt: 'desc' },
      });
      
      // Генерируем ETag для данных
      const etag = generateETag(transactions);
      
      // Если клиент прислал If-None-Match и он совпадает с ETag
      if (ctx.req?.headers['if-none-match'] === etag) {
        // Возвращаем 304 Not Modified
        throw new Error('NOT_MODIFIED');
      }
      
      // Устанавливаем ETag в заголовки ответа
      if (ctx.res) {
        ctx.res.setHeader('ETag', etag);
      }
      
      return transactions;
    }),
});
```

Для разных типов запросов можно настроить разные значения staleTime:

```typescript
// Пример настройки для конкретного запроса
const { data } = api.transactions.getAll.useQuery(
  undefined, 
  { 
    staleTime: 60 * 1000, // 1 минута для транзакций
    cacheTime: 5 * 60 * 1000 // 5 минут
  }
);

// Для редко изменяемых данных
const { data } = api.templates.getAll.useQuery(
  undefined, 
  { 
    staleTime: 24 * 60 * 60 * 1000, // 24 часа для шаблонов
    cacheTime: 7 * 24 * 60 * 60 * 1000 // 7 дней
  }
);
