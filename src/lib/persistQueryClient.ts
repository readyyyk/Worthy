/**
 * Утилиты для персистентного хранения кеша React Query
 */

import { QueryClient } from '@tanstack/react-query';
import { saveToIndexedDB, getFromIndexedDB, removeFromIndexedDB, isIndexedDBSupported } from './indexedDB';

// Версия приложения для инвалидации кеша при обновлении
const _APP_VERSION = 'v1.0.0';

/**
 * Создает персистер для IndexedDB
 * @returns Объект персистера для React Query
 */
const createIndexedDBPersister = () => {
  return {
    persistClient: async (client: string) => {
      try {
        await saveToIndexedDB('queryCache', { id: 'queryCache', data: client });
      } catch (error) {
        console.error('Ошибка сохранения кеша React Query в IndexedDB:', error);
      }
    },
    restoreClient: async () => {
      try {
        const cacheData = await getFromIndexedDB<{ id: string; data: string }>('queryCache', 'queryCache');
        if (!cacheData) return null;
        
        // Проверяем, является ли cacheData массивом или одиночным объектом
        if (Array.isArray(cacheData)) {
          return cacheData.length > 0 && cacheData[0] ? cacheData[0].data : null;
        }
        
        return cacheData?.data || null;
      } catch (error) {
        console.error('Ошибка восстановления кеша React Query из IndexedDB:', error);
        return null;
      }
    },
    removeClient: async () => {
      try {
        await removeFromIndexedDB('queryCache', 'queryCache');
      } catch (error) {
        console.error('Ошибка удаления кеша React Query из IndexedDB:', error);
      }
    },
  };
};

/**
 * Настраивает персистентное хранение кеша React Query
 * @param queryClient Экземпляр QueryClient
 */
export const setupPersistentQueryClient = (queryClient: QueryClient) => {
  // Проверяем, поддерживается ли IndexedDB
  const isIDBAvailable = isIndexedDBSupported();
  
  if (!isIDBAvailable) {
    console.warn('IndexedDB не поддерживается в этом браузере. Персистентное кеширование будет ограничено.');
    return;
  }
  
  // Восстанавливаем кеш при инициализации
  const restoreCache = async () => {
    try {
      const persister = createIndexedDBPersister();
      const cachedState = await persister.restoreClient();
      
      if (cachedState) {
        try {
          const parsedState = JSON.parse(cachedState) as unknown;
          
          // Восстанавливаем все запросы из кеша
          if (parsedState && typeof parsedState === 'object') {
            // Если это объект с запросами
            const stateObj = parsedState as Record<string, unknown>;
            if ('queries' in stateObj && Array.isArray(stateObj.queries)) {
              stateObj.queries.forEach((query: unknown) => {
                const typedQuery = query as { queryKey: unknown; state: { data: unknown } };
                if (typedQuery.queryKey && typedQuery.state) {
                  queryClient.setQueryData(typedQuery.queryKey as string[], typedQuery.state.data);
                }
              });
            } else {
              // Если это простой объект с ключами и данными
              Object.entries(stateObj).forEach(([key, value]) => {
                try {
                  const queryKey = JSON.parse(key) as unknown[];
                  queryClient.setQueryData(queryKey, value);
                } catch (e) {
                  // Если ключ не является JSON, используем его как строку
                  queryClient.setQueryData([key], value);
                }
              });
            }
          }
        } catch (parseError) {
          console.error('Ошибка парсинга кеша:', parseError);
        }
      }
    } catch (error) {
      console.error('Ошибка восстановления кеша:', error);
    }
  };
  
  // Переменные для дебаунсинга
  let debounceTimeout: NodeJS.Timeout | null = null;
  let lastSaveTime = 0;
  const DEBOUNCE_TIME = 2000; // 2 секунды
  const MIN_SAVE_INTERVAL = 10000; // 10 секунд
  
  // Функция для сохранения кеша с дебаунсингом
  const debouncedSaveCache = () => {
    // Отменяем предыдущий таймаут, если он есть
    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }
    
    // Устанавливаем новый таймаут
    debounceTimeout = setTimeout(async () => {
      const now = Date.now();
      
      // Проверяем, прошло ли достаточно времени с последнего сохранения
      if (now - lastSaveTime < MIN_SAVE_INTERVAL) {
        return;
      }
      
      try {
        const persister = createIndexedDBPersister();
        
        // Получаем все запросы из кеша
        const queryCache = queryClient.getQueryCache();
        const queries = queryCache.getAll();
        
        // Создаем объект для сохранения
        const cacheToSave: Record<string, unknown> = {};
        
        // Добавляем только успешные запросы с данными
        queries.forEach(query => {
          if (query.state.data !== undefined) {
            const queryKeyString = JSON.stringify(query.queryKey);
            cacheToSave[queryKeyString] = query.state.data;
          }
        });
        
        // Сохраняем кеш
        await persister.persistClient(JSON.stringify(cacheToSave));
        
        // Обновляем время последнего сохранения
        lastSaveTime = now;
      } catch (error) {
        console.error('Ошибка сохранения кеша:', error);
      }
    }, DEBOUNCE_TIME);
  };
  
  // Подписываемся на изменения кеша
  const unsubscribe = queryClient.getQueryCache().subscribe(() => {
    // Используем функцию-обертку для предотвращения ошибки no-misused-promises
    const saveCache = () => {
      debouncedSaveCache();
    };
    saveCache();
  });
  
  // Восстанавливаем кеш при инициализации
  restoreCache().catch(console.error);
  
  // Возвращаем функцию для отписки при необходимости
  return unsubscribe;
};

/**
 * Конфигурация кеширования для разных типов данных
 */
export const CACHE_CONFIG = {
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
  shoppingSessions: {
    staleTime: 5 * 60 * 1000, // 5 минут
    cacheTime: 60 * 60 * 1000, // 1 час
  },
  default: {
    staleTime: 5 * 60 * 1000, // 5 минут по умолчанию
    cacheTime: 30 * 60 * 1000, // 30 минут по умолчанию
  },
};

/**
 * Обновляет версию кеша для инвалидации
 * @param newVersion Новая версия кеша
 */
export const updateCacheVersion = (newVersion: string) => {
  // Обновляем версию кеша
  (window as Window & typeof globalThis & { __APP_CACHE_VERSION?: string }).__APP_CACHE_VERSION = newVersion;
  
  // Перезагружаем персистентный кеш с новой версией
  const queryClient = new QueryClient();
  setupPersistentQueryClient(queryClient);
};

/**
 * Очищает весь кеш React Query
 * @param queryClient Экземпляр QueryClient
 */
export const clearQueryCache = (queryClient: QueryClient) => {
  // Очищаем кеш в памяти
  queryClient.clear();
  
  // Очищаем персистентный кеш
  if (isIndexedDBSupported()) {
    removeFromIndexedDB('queryCache', 'queryCache')
      .catch(error => console.error('Ошибка очистки кеша в IndexedDB:', error));
  } else if (typeof window !== 'undefined' && 'localStorage' in window) {
    try {
      // Очищаем все ключи localStorage, связанные с кешем
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith('rq-cache') || key.includes('query-cache')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Ошибка очистки кеша в localStorage:', error);
    }
  }
};