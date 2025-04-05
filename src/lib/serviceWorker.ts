/**
 * Утилиты для работы с Service Worker
 */

/**
 * Регистрирует Service Worker для PWA
 */
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

/**
 * Запрашивает синхронизацию данных при восстановлении соединения
 * @param tag Тег синхронизации
 */
export const requestSync = (tag = 'sync-transactions') => {
  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    void navigator.serviceWorker.ready.then((registration) => {
      void registration.sync.register(tag)
        .catch((error: Error) => {
          console.error('Ошибка регистрации синхронизации:', error);
        });
    });
  }
};

/**
 * Проверяет, поддерживается ли Service Worker в браузере
 */
export const isServiceWorkerSupported = (): boolean => {
  return 'serviceWorker' in navigator;
};

/**
 * Проверяет, поддерживается ли Background Sync в браузере
 */
export const isBackgroundSyncSupported = (): boolean => {
  return 'serviceWorker' in navigator && 'SyncManager' in window;
};

/**
 * Проверяет, установлено ли приложение как PWA
 */
export const isPWAInstalled = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as Window['navigator'] & { standalone?: boolean }).standalone === true;
};

/**
 * Обновляет Service Worker
 */
export const updateServiceWorker = () => {
  if ('serviceWorker' in navigator) {
    void navigator.serviceWorker.ready.then((registration) => {
      void registration.update();
    });
  }
};

/**
 * Отправляет сообщение Service Worker'у
 * @param message Сообщение для отправки
 */
export const sendMessageToServiceWorker = (message: unknown) => {
  if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage(message);
  }
};

/**
 * Добавляет обработчик сообщений от Service Worker
 * @param callback Функция-обработчик сообщений
 */
export const listenToServiceWorker = (callback: (event: MessageEvent) => void) => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', callback);
  }
};

/**
 * Очищает кеш Service Worker
 */
export const clearServiceWorkerCache = async () => {
  if ('caches' in window) {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames.map(cacheName => caches.delete(cacheName))
    );
    console.log('Service Worker кеш очищен');
  }
};