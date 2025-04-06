// @ts-nocheck

// Worthy PWA Service Worker
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
  
  // Для статических ресурсов используем стратегию Cache First
  if (event.request.url.match(/\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/)) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          // Если есть в кеше, возвращаем из кеша
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Если нет в кеше, запрашиваем из сети и кешируем
          return fetch(event.request)
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
              // Если не удалось получить из сети, возвращаем ошибку
              return new Response('Network error', { status: 408, headers: { 'Content-Type': 'text/plain' } });
            });
        })
    );
    return;
  }
  
  // Для HTML страниц используем стратегию Network First
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
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  } else if (event.tag === 'sync-transactions') {
    // Для обратной совместимости
    event.waitUntil(syncTransactions());
  }
});

// Функция для синхронизации транзакций
async function syncTransactions() {
  try {
    // Получаем неотправленные транзакции из IndexedDB
    const db = await openDB();
    
    // Получаем все неотправленные транзакции
    const pendingTransactions = await getAllPendingTransactions(db);
    
    // Если нет неотправленных транзакций, завершаем
    if (!pendingTransactions || pendingTransactions.length === 0) {
      db.close();
      return;
    }
    
    // Отправляем каждую транзакцию на сервер
    for (const transaction of pendingTransactions) {
      try {
        const response = await fetch('/api/trpc/transactions.create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(transaction),
        });
        
        if (response.ok) {
          // Если успешно отправлено, удаляем из очереди
          await deletePendingTransaction(db, transaction.id);
        } else {
          console.error('Ошибка отправки транзакции:', await response.text());
        }
      } catch (fetchError) {
        console.error('Ошибка сети при отправке транзакции:', fetchError);
        // Прерываем синхронизацию при ошибке сети
        break;
      }
    }
    
    // Закрываем соединение с базой данных
    db.close();
  } catch (error) {
    console.error('Ошибка синхронизации транзакций:', error);
  }
}

// Функция для получения всех неотправленных транзакций
function getAllPendingTransactions(db) {
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction('pendingTransactions', 'readonly');
      const store = transaction.objectStore('pendingTransactions');
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    } catch (error) {
      reject(error);
    }
  });
}

// Функция для удаления транзакции из очереди
function deletePendingTransaction(db, id) {
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction('pendingTransactions', 'readwrite');
      const store = transaction.objectStore('pendingTransactions');
      const request = store.delete(id);
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    } catch (error) {
      reject(error);
    }
  });
}

// Функция для открытия IndexedDB
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('worthyDB', 2);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = request.result;
      const oldVersion = event.oldVersion;
      
      // Создаем базовые хранилища для версии 1
      if (oldVersion < 1) {
        // Создаем хранилище для неотправленных транзакций, если его нет
        if (!db.objectStoreNames.contains('pendingTransactions')) {
          db.createObjectStore('pendingTransactions', { keyPath: 'id' });
        }
      }
      
      // Добавляем новые хранилища для версии 2
      if (oldVersion < 2) {
        // Хранилище для очереди синхронизации
        if (!db.objectStoreNames.contains('syncQueue')) {
          const store = db.createObjectStore('syncQueue', { keyPath: 'id' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('type', 'operation.type', { unique: false });
        }
      }
    };
  });
}

// Функция для добавления транзакции в очередь на отправку
self.addPendingTransaction = async (transaction) => {
  try {
    const db = await openDB();
    
    return new Promise((resolve, reject) => {
      const tx = db.transaction('pendingTransactions', 'readwrite');
      const store = tx.objectStore('pendingTransactions');
      
      // Если у транзакции нет id, генерируем его
      if (!transaction.id) {
        transaction.id = Date.now().toString();
      }
      
      const request = store.put(transaction);
      
      request.onsuccess = () => {
        db.close();
        resolve(true);
      };
      
      request.onerror = () => {
        db.close();
        reject(request.error);
      };
    });
  } catch (error) {
    console.error('Ошибка добавления транзакции в очередь:', error);
    return false;
  }
};

// Функция для синхронизации всех данных
async function syncData() {
  try {
    // Открываем базу данных
    const db = await openDB();
    
    // Получаем элементы из очереди синхронизации
    const syncQueue = await getAllFromStore(db, 'syncQueue');
    
    if (!syncQueue || syncQueue.length === 0) {
      db.close();
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
    
    // Закрываем соединение с базой данных
    db.close();
  } catch (error) {
    console.error('Ошибка синхронизации данных:', error);
  }
}

// Функция для синхронизации элемента с сервером
async function syncItemWithServer(queueItem) {
  const { operation } = queueItem;
  
  // Определяем URL и метод в зависимости от типа операции
  let url = '';
  let method = 'POST';
  let body = {};
  
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
      body = operation.data;
      break;
    case 'update':
      url += 'update';
      method = 'POST';
      body = operation.data;
      break;
    case 'delete':
      url += 'delete';
      method = 'POST';
      body = { id: operation.id };
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
    body: JSON.stringify(body),
  });
  
  if (!response.ok) {
    throw new Error(`Ошибка синхронизации: ${response.status} ${response.statusText}`);
  }
  
  // Если это была операция создания, обновляем локальный ID на серверный
  if (operation.action === 'create' && typeof operation.id === 'string' && operation.id.startsWith('local_')) {
    const result = await response.json();
    if (result && result.id) {
      // Получаем объект из локального хранилища
      const db = await openDB();
      const storeName = getStoreNameByType(operation.type);
      
      const localItem = await getFromStore(db, storeName, operation.id);
      
      if (localItem) {
        // Удаляем старую запись с локальным ID
        await deleteFromStore(db, storeName, operation.id);
        
        // Создаем новую запись с серверным ID
        const updatedItem = { ...localItem, id: result.id };
        await updateInStore(db, storeName, updatedItem);
      }
      
      db.close();
    }
  }
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

// Вспомогательные функции для работы с IndexedDB
async function getAllFromStore(db, storeName) {
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    } catch (error) {
      reject(error);
    }
  });
}

async function getFromStore(db, storeName, id) {
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(id);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    } catch (error) {
      reject(error);
    }
  });
}

async function updateInStore(db, storeName, item) {
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(item);
      
      request.onsuccess = () => {
        resolve(request.result);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    } catch (error) {
      reject(error);
    }
  });
}

async function deleteFromStore(db, storeName, id) {
  return new Promise((resolve, reject) => {
    try {
      const transaction = db.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      request.onerror = () => {
        reject(request.error);
      };
    } catch (error) {
      reject(error);
    }
  });
}