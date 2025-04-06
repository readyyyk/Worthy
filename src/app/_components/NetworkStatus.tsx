'use client';

import { useEffect, useState } from 'react';
import { Badge } from '@/app/_components/ui/badge';
import { getSyncQueueCount } from '@/lib/syncQueue';
import { getUnresolvedConflicts } from '@/lib/conflictResolution';
import { Wifi, WifiOff, AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Компонент для отображения статуса сети и синхронизации
 */
export function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingSyncs, setPendingSyncs] = useState(0);
  const [conflicts, setConflicts] = useState(0);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    // Обработчики событий онлайн/офлайн
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Проверка статуса синхронизации
    const checkSyncStatus = async () => {
      try {
        // Получаем количество элементов в очереди синхронизации
        const syncCount = await getSyncQueueCount();
        setPendingSyncs(syncCount);

        // Получаем количество неразрешенных конфликтов
        const conflictsList = await getUnresolvedConflicts();
        setConflicts(conflictsList.length);
      } catch (error) {
        console.error('Ошибка проверки статуса синхронизации:', error);
      }
    };

    // Добавляем обработчики событий
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Проверяем статус каждые 5 секунд
    const interval = setInterval(checkSyncStatus, 5000);
    
    // Выполняем первичную проверку
    void checkSyncStatus();

    // Очистка при размонтировании
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  // Если нет проблем, не показываем компонент
  if (isOnline && pendingSyncs === 0 && conflicts === 0) {
    return null;
  }

  return (
    <div 
      className="fixed bottom-4 right-4 z-50 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2 cursor-pointer"
      onClick={() => setShowDetails(!showDetails)}
    >
      <div className="flex items-center gap-2">
        {isOnline ? (
          <Wifi className="h-5 w-5 text-green-500" />
        ) : (
          <WifiOff className="h-5 w-5 text-red-500" />
        )}
        
        {pendingSyncs > 0 && (
          <Badge variant="secondary" className="flex items-center gap-1">
            <RefreshCw className="h-3 w-3" />
            <span>{pendingSyncs}</span>
          </Badge>
        )}
        
        {conflicts > 0 && (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            <span>{conflicts}</span>
          </Badge>
        )}
      </div>
      
      {showDetails && (
        <div className="mt-2 text-xs space-y-1">
          <p className="font-medium">
            Статус: {isOnline ? 'Онлайн' : 'Офлайн'}
          </p>
          
          {pendingSyncs > 0 && (
            <p>
              Ожидает синхронизации: {pendingSyncs}
            </p>
          )}
          
          {conflicts > 0 && (
            <p>
              Требуется разрешение конфликтов: {conflicts}
            </p>
          )}
          
          {!isOnline && (
            <p className="text-gray-500">
              Изменения будут синхронизированы автоматически при восстановлении соединения
            </p>
          )}
        </div>
      )}
    </div>
  );
}