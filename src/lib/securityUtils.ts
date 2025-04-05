/**
 * Утилиты для обеспечения безопасности кеширования
 */

/**
 * Проверяет, содержит ли данные чувствительную информацию
 * @param data Данные для проверки
 * @returns true, если данные содержат чувствительную информацию
 */
export const isSensitiveData = (data: unknown): boolean => {
  // Проверяем, содержит ли данные чувствительную информацию
  if (!data) return false;
  
  // Проверка на наличие ключевых слов в ключах объекта
  const sensitiveKeys = ['password', 'token', 'secret', 'credit', 'card', 'cvv', 'ssn', 'social'];
  
  if (data && typeof data === 'object') {
    return Object.keys(data as Record<string, unknown>).some(key =>
      sensitiveKeys.some(sensitiveKey => key.toLowerCase().includes(sensitiveKey))
    );
  }
  
  return false;
};

/**
 * Безопасно кеширует данные, маскируя или исключая чувствительную информацию
 * @param key Ключ кеша
 * @param data Данные для кеширования
 * @returns Безопасные данные для кеширования или null, если данные не должны кешироваться
 */
export const secureCacheData = <T>(key: string, data: T): T | null => {
  // Если данные чувствительные, не кешируем их или маскируем
  if (isSensitiveData(data)) {
    // Вариант 1: Не кешировать
    return null;
    
    // Вариант 2: Маскировать чувствительные поля
    // return maskSensitiveData(data);
  }
  
  return data;
};

/**
 * Маскирует чувствительные данные
 * @param data Данные для маскирования
 * @returns Маскированные данные
 */
export const maskSensitiveData = <T>(data: T): T => {
  if (!data || typeof data !== 'object') return data;
  
  const sensitiveKeys = ['password', 'token', 'secret', 'credit', 'card', 'cvv', 'ssn', 'social'];
  const result = { ...data as object } as T;
  
  Object.keys(result as object).forEach(key => {
    if (sensitiveKeys.some(sensitiveKey => key.toLowerCase().includes(sensitiveKey))) {
      (result as Record<string, unknown>)[key] = '********';
    } else if (typeof (result as Record<string, unknown>)[key] === 'object') {
      (result as Record<string, unknown>)[key] = maskSensitiveData((result as Record<string, unknown>)[key] as T);
    }
  });
  
  return result;
};

/**
 * Санитизирует данные для безопасного кеширования (защита от XSS)
 * @param data Данные для санитизации
 * @returns Санитизированные данные
 */
export const sanitizeDataForCache = <T>(data: T): T => {
  if (!data) return data;
  
  // Для строк
  if (typeof data === 'string') {
    // Простая санитизация HTML
    const sanitized = data
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/`/g, '&#96;')
      .replace(/\$/g, '&#36;');
    return sanitized as unknown as T;
  }
  
  // Для массивов
  if (Array.isArray(data)) {
    const sanitizedArray = data.map(item => sanitizeDataForCache(item));
    return sanitizedArray as T;
  }
  
  // Для объектов
  if (typeof data === 'object') {
    const result = {} as Record<string, unknown>;
    Object.keys(data as object).forEach(key => {
      result[key] = sanitizeDataForCache((data as Record<string, unknown>)[key]);
    });
    return result as T;
  }
  
  // Для других типов данных
  return data;
};

/**
 * Создает хеш данных для проверки целостности
 * @param data Данные для хеширования
 * @returns Хеш данных
 */
export const createDataHash = (data: unknown): string => {
  // В браузере используем простой алгоритм хеширования
  if (typeof window !== 'undefined') {
    let hash = 0;
    const str = JSON.stringify(data);
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return hash.toString(16);
  }
  
  // На сервере можно использовать crypto
  try {
    // Используем crypto только на сервере
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const crypto = require('crypto') as {
      createHash: (algorithm: string) => {
        update: (data: string) => void;
        digest: (encoding: string) => string;
      };
    };
    const hash = crypto.createHash('sha256');
    hash.update(JSON.stringify(data));
    return hash.digest('hex');
  } catch (error) {
    console.error('Ошибка создания хеша:', error);
    return '';
  }
};

/**
 * Сохраняет данные с проверкой целостности
 * @param storeName Имя хранилища
 * @param data Данные для сохранения
 * @returns Promise с результатом операции
 */
export const saveWithIntegrityCheck = async <T>(storeName: string, data: T): Promise<boolean> => {
  try {
    const { saveToIndexedDB } = await import('./indexedDB');
    
    // Создаем хеш данных
    const dataHash = createDataHash(data);
    
    // Сохраняем данные вместе с хешем
    return await saveToIndexedDB(storeName, {
      ...data as object,
      _integrity: dataHash,
    } as unknown as T);
  } catch (error) {
    console.error('Ошибка сохранения данных с проверкой целостности:', error);
    return false;
  }
};

/**
 * Проверяет целостность данных
 * @param data Данные для проверки
 * @returns true, если целостность данных не нарушена
 */
export const verifyDataIntegrity = (data: unknown): boolean => {
  if (!data || typeof data !== 'object' || !('_integrity' in data)) return false;
  
  // Создаем копию данных без поля _integrity
  const { _integrity, ...dataWithoutHash } = data;
  
  // Вычисляем хеш данных
  const computedHash = createDataHash(dataWithoutHash);
  
  // Сравниваем хеши
  return _integrity === computedHash;
};

/**
 * Получает данные с проверкой целостности
 * @param storeName Имя хранилища
 * @param key Ключ для получения конкретной записи
 * @returns Promise с данными или null, если целостность нарушена
 */
export const getWithIntegrityCheck = async <T>(storeName: string, key?: IDBValidKey): Promise<T | null> => {
  try {
    // Импортируем функции для работы с IndexedDB
    const { getFromIndexedDB, removeFromIndexedDB } = await import('./indexedDB');
    
    // Получаем данные из IndexedDB
    const data = await getFromIndexedDB<T & { _integrity?: string }>(storeName, key);
    
    // Если данные не найдены
    if (!data) return null;
    
    // Проверяем, является ли data массивом
    if (Array.isArray(data)) {
      // Проверяем целостность каждого элемента массива
      const validData = data.filter(item => verifyDataIntegrity(item));
      
      // Если есть элементы с нарушенной целостностью, удаляем их
      if (validData.length !== data.length) {
        console.warn(`Обнаружены данные с нарушенной целостностью в хранилище ${storeName}`);
        
        // Собираем идентификаторы элементов с нарушенной целостностью
        const invalidItems = data.filter(item => !verifyDataIntegrity(item));
        const invalidIds = invalidItems
          .filter(item => 'id' in item)
          .map(item => (item as Record<string, unknown>).id as IDBValidKey);
        
        // Если есть идентификаторы для удаления
        if (invalidIds.length > 0) {
          // Удаляем элементы с нарушенной целостностью
          for (const id of invalidIds) {
            await removeFromIndexedDB(storeName, id);
          }
          console.info(`Удалено ${invalidIds.length} элементов с нарушенной целостностью из хранилища ${storeName}`);
        }
      }
      
      // Возвращаем только валидные данные без поля _integrity
      return validData.map(item => {
        // Используем деструктуризацию с проверкой на undefined
        if (item && typeof item === 'object' && '_integrity' in item) {
          const { _integrity, ...dataWithoutHash } = item;
          return dataWithoutHash as T;
        }
        return item as T;
      }) as unknown as T;
    }
    
    // Проверяем целостность одиночного объекта
    if (!verifyDataIntegrity(data)) {
      console.error(`Нарушена целостность кешированных данных в хранилище ${storeName}`);
      
      // Удаляем поврежденные данные
      if (key) {
        await removeFromIndexedDB(storeName, key);
        console.info(`Удален элемент с нарушенной целостностью из хранилища ${storeName}`);
      }
      return null;
    }
    
    // Удаляем поле _integrity из данных перед возвратом
    if (data && typeof data === 'object' && '_integrity' in data) {
      const { _integrity, ...dataWithoutHash } = data;
      return dataWithoutHash as T;
    }
    
    return data as T;
  } catch (error) {
    console.error('Ошибка получения данных с проверкой целостности:', error);
    return null;
  }
};

/**
 * Очищает кеш при выходе из системы
 */
export const clearCacheOnSignOut = async (): Promise<void> => {
  try {
    console.info('Начало очистки кеша при выходе из системы');
    
    // Очищаем IndexedDB
    const { removeFromIndexedDB, initDB } = await import('./indexedDB');
    
    // Получаем список всех хранилищ
    const db = await initDB();
    const storeNames = Array.from(db.objectStoreNames);
    db.close();
    
    console.info(`Обнаружено ${storeNames.length} хранилищ в IndexedDB`);
    
    // Очищаем каждое хранилище
    const clearPromises = storeNames.map(async (storeName) => {
      try {
        await removeFromIndexedDB(storeName, undefined);
        console.info(`Хранилище ${storeName} успешно очищено`);
        return true;
      } catch (storeError) {
        console.error(`Ошибка очистки хранилища ${storeName}:`, storeError);
        return false;
      }
    });
    
    // Ждем завершения всех операций очистки
    const results = await Promise.allSettled(clearPromises);
    const successCount = results.filter(r => r.status === 'fulfilled' && r.value).length;
    console.info(`Успешно очищено ${successCount} из ${storeNames.length} хранилищ`);
    
    // Очищаем sessionStorage
    if (typeof window !== 'undefined') {
      const sessionItemCount = sessionStorage.length;
      sessionStorage.clear();
      console.info(`Очищено ${sessionItemCount} элементов из sessionStorage`);
    }
    
    // Очищаем кеш Service Worker
    if (typeof window !== 'undefined' && 'caches' in window) {
      const cacheNames = await caches.keys();
      console.info(`Обнаружено ${cacheNames.length} кешей Service Worker`);
      
      if (cacheNames.length > 0) {
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
        console.info('Все кеши Service Worker успешно очищены');
      }
    }
    
    console.info('Очистка кеша при выходе из системы завершена успешно');
  } catch (error) {
    console.error('Ошибка очистки кеша при выходе:', error);
  }
};