'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/app/_components/ui/dialog';
import { Button } from '@/app/_components/ui/button';
import { getUnresolvedConflicts, resolveConflictManually, cleanupResolvedConflicts } from '@/lib/conflictResolution';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/app/_components/ui/card';
import { Badge } from '@/app/_components/ui/badge';
import { AlertTriangle } from 'lucide-react';

type ConflictData = {
  id: string;
  storeName: string;
  localItem: any;
  serverItem: any;
  createdAt: string;
  resolved: boolean;
};

/**
 * Компонент для отображения и разрешения конфликтов данных
 */
export function ConflictResolutionDialog() {
  const [conflicts, setConflicts] = useState<ConflictData[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [currentConflict, setCurrentConflict] = useState<ConflictData | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  // Загружаем неразрешенные конфликты
  const loadConflicts = async () => {
    try {
      const unresolvedConflicts = await getUnresolvedConflicts();
      setConflicts(unresolvedConflicts);
      
      // Если есть конфликты, открываем диалог
      if (unresolvedConflicts.length > 0 && !isOpen) {
        setIsOpen(true);
        setCurrentConflict(unresolvedConflicts[0] || null);
      } else if (unresolvedConflicts.length === 0 && isOpen) {
        setIsOpen(false);
        setCurrentConflict(null);
      }
    } catch (error) {
      console.error('Ошибка загрузки конфликтов:', error);
    }
  };

  // Загружаем конфликты при монтировании и каждые 10 секунд
  useEffect(() => {
    void loadConflicts();
    
    const interval = setInterval(() => {
      void loadConflicts();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // Обработчик разрешения конфликта
  const handleResolveConflict = async (resolution: 'local' | 'server' | 'merge') => {
    if (!currentConflict) return;
    
    setIsResolving(true);
    
    try {
      // Разрешаем конфликт
      await resolveConflictManually(currentConflict.id, resolution);
      
      // Обновляем список конфликтов
      const updatedConflicts = conflicts.filter(c => c.id !== currentConflict.id);
      setConflicts(updatedConflicts);
      
      // Если есть еще конфликты, показываем следующий
      if (updatedConflicts.length > 0) {
        setCurrentConflict(updatedConflicts[0] || null);
      } else {
        setCurrentConflict(null);
        setIsOpen(false);
        
        // Очищаем разрешенные конфликты
        await cleanupResolvedConflicts();
      }
    } catch (error) {
      console.error('Ошибка разрешения конфликта:', error);
    } finally {
      setIsResolving(false);
    }
  };

  // Если нет конфликтов, не отображаем компонент
  if (conflicts.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Обнаружены конфликты данных
          </DialogTitle>
        </DialogHeader>
        
        {currentConflict && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Обнаружен конфликт данных между локальной и серверной версиями. Пожалуйста, выберите, какую версию использовать.
            </p>
            
            <div className="text-sm font-medium">
              Тип данных: <Badge variant="outline">{getStoreDisplayName(currentConflict.storeName)}</Badge>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Локальная версия</CardTitle>
                  <CardDescription>
                    Изменения, сделанные на этом устройстве
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto max-h-60">
                    {formatItemForDisplay(currentConflict.localItem)}
                  </pre>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => handleResolveConflict('local')}
                    disabled={isResolving}
                  >
                    Использовать локальную
                  </Button>
                </CardFooter>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Серверная версия</CardTitle>
                  <CardDescription>
                    Изменения, сохраненные на сервере
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto max-h-60">
                    {formatItemForDisplay(currentConflict.serverItem)}
                  </pre>
                </CardContent>
                <CardFooter>
                  <Button 
                    variant="outline" 
                    onClick={() => handleResolveConflict('server')}
                    disabled={isResolving}
                  >
                    Использовать серверную
                  </Button>
                </CardFooter>
              </Card>
            </div>
            
            <div className="flex justify-center mt-4">
              <Button 
                onClick={() => handleResolveConflict('merge')}
                disabled={isResolving}
              >
                Объединить версии
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
              Осталось конфликтов: {conflicts.length}
            </p>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="ghost" onClick={() => setIsOpen(false)}>
            Отложить решение
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Возвращает отображаемое имя хранилища
 * @param storeName Имя хранилища
 * @returns Отображаемое имя
 */
function getStoreDisplayName(storeName: string): string {
  switch (storeName) {
    case 'transactions':
      return 'Транзакция';
    case 'templates':
      return 'Шаблон';
    case 'shoppingSessions':
      return 'Сессия покупок';
    default:
      return storeName;
  }
}

/**
 * Форматирует элемент для отображения
 * @param item Элемент для форматирования
 * @returns Отформатированная строка
 */
function formatItemForDisplay(item: any): string {
  try {
    // Форматируем объект для более читаемого отображения
    const formattedItem = { ...item };
    
    // Преобразуем даты в читаемый формат
    if (formattedItem.createdAt) {
      formattedItem.createdAt = new Date(formattedItem.createdAt).toLocaleString();
    }
    
    if (formattedItem.updatedAt) {
      formattedItem.updatedAt = new Date(formattedItem.updatedAt).toLocaleString();
    }
    
    // Форматируем сумму, если она есть
    if (formattedItem.amount && typeof formattedItem.amount === 'number') {
      formattedItem.amount = `${formattedItem.amount.toFixed(2)} ${formattedItem.currency || ''}`;
    }
    
    return JSON.stringify(formattedItem, null, 2);
  } catch (error) {
    console.error('Ошибка форматирования элемента:', error);
    return JSON.stringify(item, null, 2);
  }
}