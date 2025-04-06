/**
 * Утилиты для работы с IndexedDB
 */

/**
 * Инициализирует базу данных IndexedDB
 * @returns Promise с объектом базы данных
 */
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('worthyDB', 2); // Увеличиваем версию для миграции
    
    request.onerror = (_event) => {
      reject('Ошибка открытия базы данных');
    };
    
    request.onsuccess = (_event) => {
      const db = request.result;
      resolve(db);
    };
    
    request.onupgradeneeded = (event) => {
      const db = request.result;
      const oldVersion = event.oldVersion;
      
      // Создаем или обновляем хранилища в зависимости от версии
      if (oldVersion < 1) {
        // Хранилище для транзакций
        if (!db.objectStoreNames.contains('transactions')) {
          const store = db.createObjectStore('transactions', { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
          store.createIndex('isIncome', 'isIncome', { unique: false });
        }
        
        // Хранилище для пользовательских настроек
        if (!db.objectStoreNames.contains('userSettings')) {
          db.createObjectStore('userSettings', { keyPath: 'id' });
        }
        
        // Хранилище для шаблонов
        if (!db.objectStoreNames.contains('templates')) {
          const store = db.createObjectStore('templates', { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
        
        // Хранилище для кеша запросов
        if (!db.objectStoreNames.contains('queryCache')) {
          db.createObjectStore('queryCache', { keyPath: 'id' });
        }
        
        // Хранилище для неотправленных транзакций
        if (!db.objectStoreNames.contains('pendingTransactions')) {
          db.createObjectStore('pendingTransactions', { keyPath: 'id' });
        }
      }
      
      // Добавляем новые хранилища для версии 2 (local-first подход)
      if (oldVersion < 2) {
        // Хранилище для очереди синхронизации
        if (!db.objectStoreNames.contains('syncQueue')) {
          const store = db.createObjectStore('syncQueue', { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('type', 'operation.type', { unique: false });
        }
        
        // Хранилище для сессий покупок
        if (!db.objectStoreNames.contains('shoppingSessions')) {
          const store = db.createObjectStore('shoppingSessions', { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
        }
        
        // Хранилище для конфликтов данных
        if (!db.objectStoreNames.contains('conflicts')) {
          const store = db.createObjectStore('conflicts', { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('storeName', 'storeName', { unique: false });
        }
        
        // Добавляем индексы к существующим хранилищам, если их еще нет
        if (db.objectStoreNames.contains('transactions')) {
          const txStore = request.transaction?.objectStore('transactions');
          if (txStore && !txStore.indexNames.contains('updatedAt')) {
            txStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          }
          if (txStore && !txStore.indexNames.contains('createdAt')) {
            txStore.createIndex('createdAt', 'createdAt', { unique: false });
          }
          if (txStore && !txStore.indexNames.contains('isIncome')) {
            txStore.createIndex('isIncome', 'isIncome', { unique: false });
          }
        }
        
        if (db.objectStoreNames.contains('templates')) {
          const templatesStore = request.transaction?.objectStore('templates');
          if (templatesStore && !templatesStore.indexNames.contains('updatedAt')) {
            templatesStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          }
          if (templatesStore && !templatesStore.indexNames.contains('createdAt')) {
            templatesStore.createIndex('createdAt', 'createdAt', { unique: false });
          }
        }
      }
    };
  });
};

/**
 * Сохраняет данные в IndexedDB
 * @param storeName Имя хранилища
 * @param data Данные для сохранения
 * @returns Promise с результатом операции
 */
export const saveToIndexedDB = <T>(storeName: string, data: T): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    initDB().then((db) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      if (Array.isArray(data)) {
        // Для массивов обрабатываем каждый элемент отдельно
        const items = data as unknown as T[];
        let completed = 0;
        let hasError = false;
        
        items.forEach(item => {
          const request = store.put(item);
          
          request.onsuccess = () => {
            completed++;
            if (completed === items.length && !hasError) {
              db.close();
              resolve(true);
            }
          };
          
          request.onerror = () => {
            if (!hasError) {
              hasError = true;
              db.close();
              reject('Ошибка сохранения данных');
            }
          };
        });
        
        // Если массив пустой, сразу резолвим
        if (items.length === 0) {
          db.close();
          resolve(true);
        }
      } else {
        // Для одиночного объекта
        const request = store.put(data);
        
        request.onsuccess = () => {
          db.close();
          resolve(true);
        };
        
        request.onerror = () => {
          db.close();
          reject('Ошибка сохранения данных');
        };
      }
      
      // Обработка ошибок транзакции
      transaction.onerror = () => {
        db.close();
        reject('Ошибка транзакции при сохранении данных');
      };
    }).catch(reject);
  });
};

/**
 * Получает данные из IndexedDB
 * @param storeName Имя хранилища
 * @param key Ключ для получения конкретной записи (если не указан, возвращаются все записи)
 * @returns Promise с данными
 */
export const getFromIndexedDB = <T>(storeName: string, key?: IDBValidKey): Promise<T | T[] | null> => {
  return new Promise((resolve, reject) => {
    initDB().then((db) => {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      
      const request = key !== undefined ? store.get(key) : store.getAll();
      
      request.onsuccess = () => {
        db.close();
        resolve(request.result as T | T[] | null);
      };
      
      request.onerror = () => {
        db.close();
        reject('Ошибка получения данных');
      };
    }).catch(reject);
  });
};

/**
 * Удаляет данные из IndexedDB
 * @param storeName Имя хранилища
 * @param key Ключ для удаления конкретной записи (если не указан, удаляются все записи)
 * @returns Promise с результатом операции
 */
export const removeFromIndexedDB = (storeName: string, key?: IDBValidKey): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    initDB().then((db) => {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      
      const request = key !== undefined ? store.delete(key) : store.clear();
      
      request.onsuccess = () => {
        db.close();
        resolve(true);
      };
      
      request.onerror = () => {
        db.close();
        reject('Ошибка удаления данных');
      };
    }).catch(reject);
  });
};

/**
 * Проверяет, поддерживается ли IndexedDB в браузере
 * @returns true, если IndexedDB поддерживается
 */
export const isIndexedDBSupported = (): boolean => {
  return typeof indexedDB !== 'undefined';
};

/**
 * Получает размер данных в IndexedDB
 * @param storeName Имя хранилища
 * @returns Promise с размером данных в байтах
 */
export const getIndexedDBSize = async (storeName: string): Promise<number> => {
  try {
    const data = await getFromIndexedDB(storeName);
    if (!data) return 0;
    
    const jsonString = JSON.stringify(data);
    return new Blob([jsonString]).size;
  } catch (error) {
    console.error('Ошибка получения размера IndexedDB:', error);
    return 0;
  }
};

/**
 * Очищает старые данные из IndexedDB
 * @param storeName Имя хранилища
 * @param olderThan Дата, старше которой данные будут удалены
 * @param dateField Поле с датой в объекте данных
 * @returns Promise с количеством удаленных записей
 */
export const cleanupOldData = async (
  storeName: string,
  olderThan: Date,
  dateField = 'createdAt'
): Promise<number> => {
  try {
    const db = await initDB();
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    
    // Получаем все данные
    const allData = await new Promise<Record<string, unknown>[]>((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject('Ошибка получения данных');
    });
    
    // Фильтруем данные, которые нужно удалить
    const itemsToDelete = allData.filter(item => {
      const dateValue = item[dateField];
      return dateValue && new Date(dateValue as string) < olderThan;
    });
    
    // Если нет данных для удаления, завершаем
    if (itemsToDelete.length === 0) {
      db.close();
      return 0;
    }
    
    // Удаляем данные в одной транзакции
    return new Promise<number>((resolve, reject) => {
      let deletedCount = 0;
      
      // Создаем новую транзакцию для удаления
      const deleteTransaction = db.transaction(storeName, 'readwrite');
      const deleteStore = deleteTransaction.objectStore(storeName);
      
      // Обработчики транзакции
      deleteTransaction.oncomplete = () => {
        db.close();
        resolve(deletedCount);
      };
      
      deleteTransaction.onerror = () => {
        db.close();
        reject('Ошибка транзакции при удалении данных');
      };
      
      // Удаляем каждый элемент
      itemsToDelete.forEach(item => {
        if ('id' in item) {
          const itemId = item.id as IDBValidKey;
          const request = deleteStore.delete(itemId);
          
          request.onsuccess = () => {
            deletedCount++;
          };
        }
      });
    });
  } catch (error) {
    console.error('Ошибка очистки старых данных:', error);
    return 0;
  }
};