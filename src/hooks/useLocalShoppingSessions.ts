'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFromIndexedDB, saveToIndexedDB, removeFromIndexedDB } from '@/lib/indexedDB';
import { addToSyncQueue } from '@/lib/syncQueue';
import { mergeData } from '@/lib/conflictResolution';
import { api } from '@/trpc/react';

// Определяем тип сессии покупок
type ShoppingSession = {
  id: string | number;
  name: string | null;
  createdAt?: Date | string;
  updatedAt?: string;
  ownerId?: number;
};

/**
 * Хук для работы с сессиями покупок в режиме local-first
 */
export function useLocalShoppingSessions() {
  const queryClient = useQueryClient();
  
  // Запрос к локальной базе данных
  const localQuery = useQuery({
    queryKey: ['shoppingSessions', 'local'],
    queryFn: async () => {
      try {
        const result = await getFromIndexedDB('shoppingSessions');
        
        if (!result) {
          return [];
        }
        
        // Приводим результат к массиву сессий
        const sessions = Array.isArray(result) ? result as ShoppingSession[] : [result as ShoppingSession];
        
        return sessions;
      } catch (error) {
        console.error('Ошибка получения локальных сессий покупок:', error);
        return [];
      }
    },
    staleTime: 30 * 1000, // 30 секунд
  });
  
  // Запрос к серверу (выполняется после получения локальных данных)
  const serverQuery = api.shoppingSessions.getSessionsList.useQuery({
    page: 1,
    perPage: 1000 // Получаем все сессии
  }, {
    enabled: localQuery.isSuccess && navigator.onLine, // Запускаем только после получения локальных данных и при наличии соединения
    staleTime: 60 * 1000, // 1 минута
    onSuccess: async (serverData) => {
      try {
        // Получаем все локальные сессии для синхронизации
        const localResult = await getFromIndexedDB('shoppingSessions');
        const localSessions = Array.isArray(localResult) ? localResult as ShoppingSession[] : localResult ? [localResult as ShoppingSession] : [];
        
        // Получаем все серверные сессии и преобразуем их к типу ShoppingSession
        const serverSessions = Array.isArray(serverData) 
          ? serverData.map(session => ({
              ...session,
              createdAt: new Date(), // Добавляем поле createdAt, если его нет
            })) as ShoppingSession[]
          : [];
        
        // Объединяем локальные и серверные данные
        await mergeData<ShoppingSession>(localSessions, serverSessions, 'shoppingSessions', 'timestamp');
        
        // Инвалидируем кеш локальных сессий
        queryClient.invalidateQueries({ queryKey: ['shoppingSessions', 'local'] });
      } catch (error) {
        console.error('Ошибка синхронизации сессий покупок:', error);
      }
    },
  });
  
  // Мутация для создания сессии покупок
  const createMutation = useMutation({
    mutationFn: async (session: { name: string | null }) => {
      try {
        // Генерируем локальный ID
        const localId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        // Создаем новую сессию с локальным ID
        const newSession: ShoppingSession = {
          ...session,
          id: localId,
          createdAt: new Date(),
          updatedAt: new Date().toISOString(),
        };
        
        // Сохраняем сессию локально
        await saveToIndexedDB('shoppingSessions', newSession);
        
        // Добавляем в очередь синхронизации
        await addToSyncQueue({
          type: 'shoppingSession',
          action: 'create',
          data: newSession,
          id: localId,
        });
        
        return localId;
      } catch (error) {
        console.error('Ошибка создания сессии покупок:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Инвалидируем кеш локальных сессий
      queryClient.invalidateQueries({ queryKey: ['shoppingSessions', 'local'] });
    },
  });
  
  // Мутация для обновления сессии покупок
  const updateMutation = useMutation({
    mutationFn: async (session: ShoppingSession) => {
      try {
        // Добавляем метку времени
        const updatedSession = {
          ...session,
          updatedAt: new Date().toISOString(),
        };
        
        // Сохраняем сессию локально
        await saveToIndexedDB('shoppingSessions', updatedSession);
        
        // Добавляем в очередь синхронизации
        await addToSyncQueue({
          type: 'shoppingSession',
          action: 'update',
          data: updatedSession,
          id: session.id,
        });
        
        return session.id;
      } catch (error) {
        console.error('Ошибка обновления сессии покупок:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Инвалидируем кеш локальных сессий
      queryClient.invalidateQueries({ queryKey: ['shoppingSessions', 'local'] });
    },
  });
  
  // Мутация для удаления сессии покупок
  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => {
      try {
        // Получаем сессию перед удалением
        const result = await getFromIndexedDB('shoppingSessions', id);
        
        if (!result) {
          throw new Error('Сессия покупок не найдена');
        }
        
        // Удаляем сессию локально
        await removeFromIndexedDB('shoppingSessions', id);
        
        // Добавляем в очередь синхронизации
        await addToSyncQueue({
          type: 'shoppingSession',
          action: 'delete',
          data: { id },
          id,
        });
        
        return id;
      } catch (error) {
        console.error('Ошибка удаления сессии покупок:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Инвалидируем кеш локальных сессий
      queryClient.invalidateQueries({ queryKey: ['shoppingSessions', 'local'] });
    },
  });
  
  return {
    // Возвращаем локальные данные, если они есть, иначе пустой массив
    data: localQuery.data || [],
    isLoading: localQuery.isLoading,
    isError: localQuery.isError || serverQuery.isError,
    error: localQuery.error || serverQuery.error,
    create: createMutation.mutate,
    update: updateMutation.mutate,
    delete: deleteMutation.mutate,
    isCreating: createMutation.isLoading,
    isUpdating: updateMutation.isLoading,
    isDeleting: deleteMutation.isLoading,
  };
}