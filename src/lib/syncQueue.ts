/**
 * Утилиты для работы с очередью синхронизации
 */

import { saveToIndexedDB, getFromIndexedDB, removeFromIndexedDB } from './indexedDB';
import { api } from '@/trpc/react';

// Типы операций для синхронизации
export type SyncOperation = {
  type: 'transaction' | 'template' | 'shoppingSession';
  action: 'create' | 'update' | 'delete';
  data: any;
  id: string | number;
};

// Статусы элементов очереди
export type SyncStatus = 'pending' | 'processing' | 'failed' | 'manual_resolution_required';

// Элемент очереди синхронизации
export type SyncQueueItem = {
  id: string;
  operation: SyncOperation;
  createdAt: string;
  attempts: number;
  status: SyncStatus;
};

/**
 * Добавляет операцию в очередь синхронизации
 * @param operation Операция для добавления в очередь
 * @returns Promise, который разрешается после добавления операции
 */
export const addToSyncQueue = async (operation: SyncOperation): Promise<void> => {
  const queueItem: SyncQueueItem = {
    id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    operation,
    createdAt: new Date().toISOString(),
    attempts: 0,
    status: 'pending',
  };
  
  await saveToIndexedDB('syncQueue', queueItem);
  
  // Запускаем синхронизацию, если есть подключение к интернету
  if (navigator.onLine) {
    void processSyncQueue();
  }
};

/**
 * Обрабатывает очередь синхронизации
 * @returns Promise, который разрешается после обработки очереди
 */
export const processSyncQueue = async (): Promise<void> => {
  if (!navigator.onLine) return;
  
  try {
    // Получаем все элементы очереди
    const result = await getFromIndexedDB('syncQueue');
    
    // Проверяем, что получили массив и он не пустой
    if (!result) {
      return;
    }
    
    // Приводим результат к массиву SyncQueueItem
    const queueData = Array.isArray(result) ? result as SyncQueueItem[] : [result as SyncQueueItem];
    
    if (queueData.length === 0) {
      return;
    }
    
    // Сортируем по времени создания
    const sortedQueue = [...queueData].sort((a, b) => {
      if (!a || !b || !a.createdAt || !b.createdAt) return 0;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
    
    // Обрабатываем каждый элемент очереди
    for (const item of sortedQueue) {
      if (!item || item.status !== 'pending') continue;
      
      try {
        // Создаем копию элемента для обновления
        const updatedItem: SyncQueueItem = {
          id: item.id,
          operation: item.operation,
          createdAt: item.createdAt,
          attempts: item.attempts + 1,
          status: 'processing'
        };
        
        // Сохраняем обновленный статус
        await saveToIndexedDB('syncQueue', updatedItem);
        
        // Выполняем операцию на сервере
        await syncItemWithServer(updatedItem);
        
        // Если успешно, удаляем из очереди
        await removeFromIndexedDB('syncQueue', updatedItem.id);
      } catch (error) {
        console.error('Ошибка синхронизации:', error);
        
        // Создаем копию элемента для обновления статуса
        const failedItem: SyncQueueItem = {
          id: item.id,
          operation: item.operation,
          createdAt: item.createdAt,
          attempts: item.attempts,
          status: 'failed'
        };
        
        // Если превышено количество попыток, помечаем как требующее ручного разрешения
        if (failedItem.attempts >= 5) {
          failedItem.status = 'manual_resolution_required';
        }
        
        // Сохраняем обновленный статус
        await saveToIndexedDB('syncQueue', failedItem);
      }
    }
  } catch (error) {
    console.error('Ошибка обработки очереди синхронизации:', error);
  }
};

/**
 * Синхронизирует элемент с сервером
 * @param queueItem Элемент очереди для синхронизации
 * @returns Promise, который разрешается после синхронизации
 */
const syncItemWithServer = async (queueItem: SyncQueueItem): Promise<void> => {
  const { operation } = queueItem;
  
  try {
    // Выполняем соответствующую операцию через tRPC
    switch (operation.type) {
      case 'transaction':
        await syncTransactionWithServer(operation);
        break;
      case 'template':
        await syncTemplateWithServer(operation);
        break;
      case 'shoppingSession':
        await syncShoppingSessionWithServer(operation);
        break;
      default:
        throw new Error(`Неизвестный тип операции: ${operation.type}`);
    }
  } catch (error) {
    console.error(`Ошибка синхронизации ${operation.type}:`, error);
    throw error;
  }
};

/**
 * Синхронизирует транзакцию с сервером
 * @param operation Операция для синхронизации
 * @returns Promise, который разрешается после синхронизации
 */
const syncTransactionWithServer = async (operation: SyncOperation): Promise<void> => {
  const { action, data, id } = operation;
  
  switch (action) {
    case 'create': {
      // Если ID начинается с 'local_', это локально созданная транзакция
      if (typeof id === 'string' && id.startsWith('local_')) {
        // Создаем новую транзакцию на сервере через fetch
        const response = await fetch('/api/trpc/transactions.create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            json: {
              ...data,
              // Удаляем локальный ID, сервер сам сгенерирует ID
              id: undefined
            }
          }),
        });
        
        const result = await response.json();
        
        if (result) {
          // Получаем транзакцию из локального хранилища
          const localTransactionData = await getFromIndexedDB('transactions', id);
          
          if (localTransactionData) {
            // Удаляем старую запись с локальным ID
            await removeFromIndexedDB('transactions', id);
            
            // Создаем новую запись с серверным ID
            const updatedTransaction = { 
              ...localTransactionData, 
              id: result, // Предполагаем, что сервер возвращает ID созданной транзакции
              updatedAt: new Date().toISOString()
            };
            await saveToIndexedDB('transactions', updatedTransaction);
          }
        }
      } else {
        // Если ID не локальный, просто создаем транзакцию через fetch
        await fetch('/api/trpc/transactions.create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            json: data
          }),
        });
      }
      break;
    }
    case 'update': {
      // Обновляем транзакцию на сервере через fetch
      await fetch('/api/trpc/transactions.update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          json: data
        }),
      });
      break;
    }
    case 'delete': {
      // Удаляем транзакцию на сервере через fetch
      await fetch('/api/trpc/transactions.delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          json: Number(id)
        }),
      });
      break;
    }
    default:
      throw new Error(`Неизвестное действие: ${action}`);
  }
};

/**
 * Синхронизирует шаблон с сервером
 * @param operation Операция для синхронизации
 * @returns Promise, который разрешается после синхронизации
 */
const syncTemplateWithServer = async (operation: SyncOperation): Promise<void> => {
  const { action, data, id } = operation;
  
  switch (action) {
    case 'create': {
      // Если ID начинается с 'local_', это локально созданный шаблон
      if (typeof id === 'string' && id.startsWith('local_')) {
        // Создаем новый шаблон на сервере через fetch
        const response = await fetch('/api/trpc/templates.create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            json: {
              ...data,
              // Удаляем локальный ID, сервер сам сгенерирует ID
              id: undefined
            }
          }),
        });
        
        const result = await response.json();
        
        if (result) {
          // Получаем шаблон из локального хранилища
          const localTemplateData = await getFromIndexedDB('templates', id);
          
          if (localTemplateData) {
            // Удаляем старую запись с локальным ID
            await removeFromIndexedDB('templates', id);
            
            // Создаем новую запись с серверным ID
            const updatedTemplate = { 
              ...localTemplateData, 
              id: result, // Предполагаем, что сервер возвращает ID созданного шаблона
              updatedAt: new Date().toISOString()
            };
            await saveToIndexedDB('templates', updatedTemplate);
          }
        }
      } else {
        // Если ID не локальный, просто создаем шаблон через fetch
        await fetch('/api/trpc/templates.create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            json: data
          }),
        });
      }
      break;
    }
    case 'update': {
      // Обновляем шаблон на сервере через fetch
      await fetch('/api/trpc/templates.update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          json: data
        }),
      });
      break;
    }
    case 'delete': {
      // Удаляем шаблон на сервере через fetch
      await fetch('/api/trpc/templates.delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          json: Number(id)
        }),
      });
      break;
    }
    default:
      throw new Error(`Неизвестное действие: ${action}`);
  }
};

/**
 * Синхронизирует сессию покупок с сервером
 * @param operation Операция для синхронизации
 * @returns Promise, который разрешается после синхронизации
 */
const syncShoppingSessionWithServer = async (operation: SyncOperation): Promise<void> => {
  const { action, data, id } = operation;
  
  switch (action) {
    case 'create': {
      // Если ID начинается с 'local_', это локально созданная сессия
      if (typeof id === 'string' && id.startsWith('local_')) {
        // Создаем новую сессию на сервере через fetch
        const response = await fetch('/api/trpc/shoppingSessions.createSession', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            json: {
              ...data,
              // Удаляем локальный ID, сервер сам сгенерирует ID
              id: undefined
            }
          }),
        });
        
        const result = await response.json();
        
        if (result) {
          // Получаем сессию из локального хранилища
          const localSessionData = await getFromIndexedDB('shoppingSessions', id);
          
          if (localSessionData) {
            // Удаляем старую запись с локальным ID
            await removeFromIndexedDB('shoppingSessions', id);
            
            // Создаем новую запись с серверным ID
            const updatedSession = { 
              ...localSessionData, 
              id: result, // Предполагаем, что сервер возвращает ID созданной сессии
              updatedAt: new Date().toISOString()
            };
            await saveToIndexedDB('shoppingSessions', updatedSession);
          }
        }
      } else {
        // Если ID не локальный, просто создаем сессию через fetch
        await fetch('/api/trpc/shoppingSessions.createSession', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            json: data
          }),
        });
      }
      break;
    }
    case 'update': {
      // Обновляем сессию на сервере через fetch
      await fetch('/api/trpc/shoppingSessions.updateSession', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          json: data
        }),
      });
      break;
    }
    case 'delete': {
      // Удаляем сессию на сервере через fetch
      await fetch('/api/trpc/shoppingSessions.deleteSession', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          json: Number(id)
        }),
      });
      break;
    }
    default:
      throw new Error(`Неизвестное действие: ${action}`);
  }
};

/**
 * Настраивает обработчики событий для синхронизации
 */
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

/**
 * Получает количество элементов в очереди синхронизации
 * @returns Promise с количеством элементов
 */
export const getSyncQueueCount = async (): Promise<number> => {
  try {
    const queueData = await getFromIndexedDB<SyncQueueItem[] | null>('syncQueue');
    return queueData && Array.isArray(queueData) ? queueData.length : 0;
  } catch (error) {
    console.error('Ошибка получения количества элементов в очереди синхронизации:', error);
    return 0;
  }
};

/**
 * Получает элементы очереди синхронизации
 * @param status Статус для фильтрации (опционально)
 * @returns Promise с элементами очереди
 */
export const getSyncQueueItems = async (status?: SyncStatus): Promise<SyncQueueItem[]> => {
  try {
    const result = await getFromIndexedDB('syncQueue');
    
    if (!result) {
      return [];
    }
    
    // Приводим результат к массиву SyncQueueItem
    const queueData = Array.isArray(result) ? result as SyncQueueItem[] : [result as SyncQueueItem];
    
    if (status) {
      return queueData.filter(item => item && item.status === status);
    }
    
    return queueData;
  } catch (error) {
    console.error('Ошибка получения элементов очереди синхронизации:', error);
    return [];
  }
};

/**
 * Сбрасывает статус элемента очереди на 'pending'
 * @param id ID элемента очереди
 * @returns Promise, который разрешается после сброса статуса
 */
export const resetSyncQueueItemStatus = async (id: string): Promise<boolean> => {
  try {
    const result = await getFromIndexedDB('syncQueue', id);
    
    if (!result) {
      return false;
    }
    
    const itemData = result as SyncQueueItem;
    
    const updatedItem: SyncQueueItem = {
      id: itemData.id,
      operation: itemData.operation,
      createdAt: itemData.createdAt,
      attempts: 0,
      status: 'pending'
    };
    
    await saveToIndexedDB('syncQueue', updatedItem);
    return true;
  } catch (error) {
    console.error('Ошибка сброса статуса элемента очереди:', error);
    return false;
  }
};