/**
 * Утилиты для разрешения конфликтов данных при синхронизации
 */

import { saveToIndexedDB, getFromIndexedDB, removeFromIndexedDB } from './indexedDB';

// Типы стратегий разрешения конфликтов
export type ConflictResolutionStrategy = 'timestamp' | 'merge' | 'manual';

// Тип конфликта данных
export type DataConflict<T> = {
  id: string;
  storeName: string;
  localItem: T;
  serverItem: T;
  createdAt: string;
  resolved: boolean;
};

/**
 * Разрешает конфликт данных между локальной и серверной версиями
 * @param localItem Локальная версия данных
 * @param serverItem Серверная версия данных
 * @param strategy Стратегия разрешения конфликта
 * @param storeName Имя хранилища
 * @returns Promise с разрешенной версией данных
 */
export const resolveConflict = async <T extends { id: string | number; updatedAt?: string }>(
  localItem: T,
  serverItem: T,
  strategy: ConflictResolutionStrategy = 'timestamp',
  storeName: string,
): Promise<T> => {
  // Если стратегия - по временной метке
  if (strategy === 'timestamp') {
    const localTime = localItem.updatedAt ? new Date(localItem.updatedAt).getTime() : 0;
    const serverTime = serverItem.updatedAt ? new Date(serverItem.updatedAt).getTime() : 0;
    
    // Используем более новую версию
    if (localTime > serverTime) {
      return localItem;
    } else {
      await saveToIndexedDB(storeName, serverItem);
      return serverItem;
    }
  }
  
  // Если стратегия - слияние полей
  if (strategy === 'merge') {
    const mergedItem = { ...serverItem, ...localItem };
    await saveToIndexedDB(storeName, mergedItem);
    return mergedItem;
  }
  
  // Если стратегия - ручное разрешение, сохраняем конфликт для последующего разрешения
  if (strategy === 'manual') {
    const conflict: DataConflict<T> = {
      id: `${storeName}_${localItem.id}`,
      storeName,
      localItem,
      serverItem,
      createdAt: new Date().toISOString(),
      resolved: false
    };
    
    await saveToIndexedDB('conflicts', conflict);
    
    // По умолчанию используем серверную версию
    await saveToIndexedDB(storeName, serverItem);
    return serverItem;
  }
  
  // По умолчанию используем серверную версию
  await saveToIndexedDB(storeName, serverItem);
  return serverItem;
};

/**
 * Получает неразрешенные конфликты данных
 * @returns Promise с массивом неразрешенных конфликтов
 */
export const getUnresolvedConflicts = async (): Promise<DataConflict<any>[]> => {
  try {
    const result = await getFromIndexedDB('conflicts');
    
    if (!result) {
      return [];
    }
    
    // Приводим результат к массиву DataConflict
    const conflicts = Array.isArray(result) ? result as DataConflict<any>[] : [result as DataConflict<any>];
    
    // Фильтруем только неразрешенные конфликты
    return conflicts.filter(conflict => !conflict.resolved);
  } catch (error) {
    console.error('Ошибка получения неразрешенных конфликтов:', error);
    return [];
  }
};

/**
 * Разрешает конфликт данных вручную
 * @param conflictId ID конфликта
 * @param resolution Способ разрешения конфликта
 * @returns Promise, который разрешается после разрешения конфликта
 */
export const resolveConflictManually = async (
  conflictId: string,
  resolution: 'local' | 'server' | 'merge',
): Promise<boolean> => {
  try {
    const result = await getFromIndexedDB('conflicts', conflictId);
    
    if (!result) {
      return false;
    }
    
    const conflict = result as DataConflict<any>;
    const { storeName, localItem, serverItem } = conflict;
    
    if (resolution === 'local') {
      await saveToIndexedDB(storeName, localItem);
    } else if (resolution === 'server') {
      await saveToIndexedDB(storeName, serverItem);
    } else if (resolution === 'merge') {
      const mergedItem = { ...serverItem, ...localItem };
      await saveToIndexedDB(storeName, mergedItem);
    }
    
    // Помечаем конфликт как разрешенный
    const resolvedConflict: DataConflict<any> = {
      ...conflict,
      resolved: true
    };
    
    await saveToIndexedDB('conflicts', resolvedConflict);
    return true;
  } catch (error) {
    console.error('Ошибка разрешения конфликта:', error);
    return false;
  }
};

/**
 * Удаляет разрешенные конфликты
 * @returns Promise с количеством удаленных конфликтов
 */
export const cleanupResolvedConflicts = async (): Promise<number> => {
  try {
    const result = await getFromIndexedDB('conflicts');
    
    if (!result) {
      return 0;
    }
    
    // Приводим результат к массиву DataConflict
    const conflicts = Array.isArray(result) ? result as DataConflict<any>[] : [result as DataConflict<any>];
    
    // Фильтруем только разрешенные конфликты
    const resolvedConflicts = conflicts.filter(conflict => conflict.resolved);
    
    // Удаляем каждый разрешенный конфликт
    let deletedCount = 0;
    for (const conflict of resolvedConflicts) {
      await removeFromIndexedDB('conflicts', conflict.id);
      deletedCount++;
    }
    
    return deletedCount;
  } catch (error) {
    console.error('Ошибка очистки разрешенных конфликтов:', error);
    return 0;
  }
};

/**
 * Объединяет локальные и серверные данные с разрешением конфликтов
 * @param localItems Локальные данные
 * @param serverItems Серверные данные
 * @param storeName Имя хранилища
 * @param strategy Стратегия разрешения конфликтов
 * @returns Promise с объединенными данными
 */
export const mergeData = async <T extends { id: string | number; updatedAt?: string }>(
  localItems: T[],
  serverItems: T[],
  storeName: string,
  strategy: ConflictResolutionStrategy = 'timestamp',
): Promise<T[]> => {
  // Создаем Map для быстрого поиска
  const localMap = new Map(localItems.map(item => [item.id.toString(), item]));
  const serverMap = new Map(serverItems.map(item => [item.id.toString(), item]));
  
  // Находим элементы, которые есть на сервере, но нет локально
  const newServerItems = serverItems.filter(item => !localMap.has(item.id.toString()));
  
  // Находим элементы, которые нужно обновить локально
  const itemsToUpdate: T[] = [];
  
  // Проверяем каждый серверный элемент
  for (const serverItem of serverItems) {
    const localItem = localMap.get(serverItem.id.toString());
    
    // Если элемент есть и локально, и на сервере, проверяем на конфликт
    if (localItem) {
      const localTime = localItem.updatedAt ? new Date(localItem.updatedAt).getTime() : 0;
      const serverTime = serverItem.updatedAt ? new Date(serverItem.updatedAt).getTime() : 0;
      
      // Если есть конфликт (обе версии изменены)
      if (localTime > 0 && serverTime > 0 && localTime !== serverTime) {
        // Разрешаем конфликт согласно выбранной стратегии
        const resolvedItem = await resolveConflict(localItem, serverItem, strategy, storeName);
        itemsToUpdate.push(resolvedItem);
      } 
      // Если нет конфликта, используем более новую версию
      else if (serverTime > localTime) {
        itemsToUpdate.push(serverItem);
      }
    }
  }
  
  // Сохраняем новые и обновленные элементы локально
  for (const item of [...newServerItems, ...itemsToUpdate]) {
    await saveToIndexedDB(storeName, item);
  }
  
  // Находим локальные элементы с временными ID, которые еще не синхронизированы
  const localOnly = localItems.filter(item => 
    typeof item.id === 'string' && item.id.toString().startsWith('local_')
  );
  
  // Возвращаем объединенные данные
  return [...serverItems, ...localOnly];
};