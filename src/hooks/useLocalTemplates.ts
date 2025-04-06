'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFromIndexedDB, saveToIndexedDB, removeFromIndexedDB } from '@/lib/indexedDB';
import { addToSyncQueue } from '@/lib/syncQueue';
import { mergeData } from '@/lib/conflictResolution';
import { api } from '@/trpc/react';

// Определяем тип шаблона
type Template = {
  id: string | number;
  name: string;
  amount: number;
  isIncome: boolean;
  currency: string;
  description: string;
  createdAt?: Date | string;
  updatedAt?: string;
  tags?: string[];
  ownerId?: number;
};

/**
 * Хук для работы с шаблонами в режиме local-first
 */
export function useLocalTemplates() {
  const queryClient = useQueryClient();
  
  // Запрос к локальной базе данных
  const localQuery = useQuery({
    queryKey: ['templates', 'local'],
    queryFn: async () => {
      try {
        const result = await getFromIndexedDB('templates');
        
        if (!result) {
          return [];
        }
        
        // Приводим результат к массиву шаблонов
        const templates = Array.isArray(result) ? result as Template[] : [result as Template];
        
        return templates;
      } catch (error) {
        console.error('Ошибка получения локальных шаблонов:', error);
        return [];
      }
    },
    staleTime: 30 * 1000, // 30 секунд
  });
  
  // Запрос к серверу (выполняется после получения локальных данных)
  const serverQuery = api.templates.getList.useQuery(undefined, {
    enabled: localQuery.isSuccess && navigator.onLine, // Запускаем только после получения локальных данных и при наличии соединения
    staleTime: 60 * 1000, // 1 минута
    onSuccess: async (serverData) => {
      try {
        // Получаем все локальные шаблоны для синхронизации
        const localResult = await getFromIndexedDB('templates');
        const localTemplates = Array.isArray(localResult) ? localResult as Template[] : localResult ? [localResult as Template] : [];
        
        // Получаем все серверные шаблоны и преобразуем их к типу Template
        const serverTemplates = Array.isArray(serverData)
          ? serverData.map(template => ({
              ...template,
              createdAt: new Date(), // Добавляем поле createdAt, если его нет
            })) as Template[]
          : [];
        
        // Объединяем локальные и серверные данные
        await mergeData<Template>(localTemplates, serverTemplates, 'templates', 'timestamp');
        
        // Инвалидируем кеш локальных шаблонов
        queryClient.invalidateQueries({ queryKey: ['templates', 'local'] });
      } catch (error) {
        console.error('Ошибка синхронизации шаблонов:', error);
      }
    },
  });
  
  // Мутация для создания шаблона
  const createMutation = useMutation({
    mutationFn: async (template: Omit<Template, 'id'>) => {
      try {
        // Генерируем локальный ID
        const localId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        // Создаем новый шаблон с локальным ID
        const newTemplate: Template = {
          ...template,
          id: localId,
          createdAt: new Date(),
          updatedAt: new Date().toISOString(),
        };
        
        // Сохраняем шаблон локально
        await saveToIndexedDB('templates', newTemplate);
        
        // Добавляем в очередь синхронизации
        await addToSyncQueue({
          type: 'template',
          action: 'create',
          data: newTemplate,
          id: localId,
        });
        
        return localId;
      } catch (error) {
        console.error('Ошибка создания шаблона:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Инвалидируем кеш локальных шаблонов
      queryClient.invalidateQueries({ queryKey: ['templates', 'local'] });
    },
  });
  
  // Мутация для обновления шаблона
  const updateMutation = useMutation({
    mutationFn: async (template: Template) => {
      try {
        // Добавляем метку времени
        const updatedTemplate = {
          ...template,
          updatedAt: new Date().toISOString(),
        };
        
        // Сохраняем шаблон локально
        await saveToIndexedDB('templates', updatedTemplate);
        
        // Добавляем в очередь синхронизации
        await addToSyncQueue({
          type: 'template',
          action: 'update',
          data: updatedTemplate,
          id: template.id,
        });
        
        return template.id;
      } catch (error) {
        console.error('Ошибка обновления шаблона:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Инвалидируем кеш локальных шаблонов
      queryClient.invalidateQueries({ queryKey: ['templates', 'local'] });
    },
  });
  
  // Мутация для удаления шаблона
  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => {
      try {
        // Получаем шаблон перед удалением
        const result = await getFromIndexedDB('templates', id);
        
        if (!result) {
          throw new Error('Шаблон не найден');
        }
        
        // Удаляем шаблон локально
        await removeFromIndexedDB('templates', id);
        
        // Добавляем в очередь синхронизации
        await addToSyncQueue({
          type: 'template',
          action: 'delete',
          data: { id },
          id,
        });
        
        return id;
      } catch (error) {
        console.error('Ошибка удаления шаблона:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Инвалидируем кеш локальных шаблонов
      queryClient.invalidateQueries({ queryKey: ['templates', 'local'] });
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