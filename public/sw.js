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
  if (event.tag === 'sync-transactions') {
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
    const request = indexedDB.open('worthyDB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = request.result;
      // Создаем хранилище для неотправленных транзакций, если его нет
      if (!db.objectStoreNames.contains('pendingTransactions')) {
        db.createObjectStore('pendingTransactions', { keyPath: 'id' });
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