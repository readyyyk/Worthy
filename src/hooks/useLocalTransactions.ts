'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFromIndexedDB, saveToIndexedDB, removeFromIndexedDB } from '@/lib/indexedDB';
import { addToSyncQueue } from '@/lib/syncQueue';
import { mergeData } from '@/lib/conflictResolution';
import { api } from '@/trpc/react';
import { type RouterOutputs } from '@/trpc/shared';

// Определяем тип транзакции
type Transaction = {
  id: string | number;
  amount: number;
  isIncome: boolean;
  currency: string;
  description: string;
  createdAt: Date | string;
  updatedAt?: string;
  tags?: string[];
  session?: {
    id: number;
    name: string | null;
  } | null;
};

/**
 * Хук для работы с транзакциями в режиме local-first
 */
export function useLocalTransactions(options: {
  page?: number;
  perPage?: number;
  description?: string;
  tags?: string[];
  startDate?: number;
  endDate?: number;
  sessionId?: number;
  groupBySession?: boolean;
} = {}) {
  const queryClient = useQueryClient();
  
  // Параметры запроса
  const queryParams = {
    page: options.page ?? 1,
    perPage: options.perPage ?? 10,
    description: options.description ?? '',
    tags: options.tags ?? [],
    startDate: options.startDate,
    endDate: options.endDate,
    sessionId: options.sessionId,
    groupBySession: options.groupBySession
  };
  
  // Запрос к локальной базе данных
  const localQuery = useQuery({
    queryKey: ['transactions', 'local', queryParams],
    queryFn: async () => {
      try {
        const result = await getFromIndexedDB('transactions');
        
        if (!result) {
          return [];
        }
        
        // Приводим результат к массиву транзакций
        const transactions = Array.isArray(result) ? result as Transaction[] : [result as Transaction];
        
        // Фильтруем транзакции согласно параметрам запроса
        return filterTransactions(transactions, queryParams);
      } catch (error) {
        console.error('Ошибка получения локальных транзакций:', error);
        return [];
      }
    },
    staleTime: 30 * 1000, // 30 секунд
  });
  
  // Запрос к серверу (выполняется после получения локальных данных)
  const serverQuery = api.transactions.getList.useQuery(queryParams, {
    enabled: localQuery.isSuccess && navigator.onLine, // Запускаем только после получения локальных данных и при наличии соединения
    staleTime: 60 * 1000, // 1 минута
    onSuccess: async (serverData) => {
      try {
        // Получаем все локальные транзакции для синхронизации
        const localResult = await getFromIndexedDB('transactions');
        const localTransactions = Array.isArray(localResult) ? localResult as Transaction[] : localResult ? [localResult as Transaction] : [];
        
        // Получаем все серверные транзакции
        const serverTransactions = Array.isArray(serverData) ? serverData : [];
        
        // Объединяем локальные и серверные данные
        await mergeData(localTransactions, serverTransactions, 'transactions', 'timestamp');
        
        // Инвалидируем кеш локальных транзакций
        queryClient.invalidateQueries({ queryKey: ['transactions', 'local'] });
      } catch (error) {
        console.error('Ошибка синхронизации транзакций:', error);
      }
    },
  });
  
  // Мутация для создания транзакции
  const createMutation = useMutation({
    mutationFn: async (transaction: Omit<Transaction, 'id'>) => {
      try {
        // Генерируем локальный ID
        const localId = `local_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        
        // Создаем новую транзакцию с локальным ID
        const newTransaction: Transaction = {
          ...transaction,
          id: localId,
          createdAt: new Date(),
          updatedAt: new Date().toISOString(),
        };
        
        // Сохраняем транзакцию локально
        await saveToIndexedDB('transactions', newTransaction);
        
        // Добавляем в очередь синхронизации
        await addToSyncQueue({
          type: 'transaction',
          action: 'create',
          data: newTransaction,
          id: localId,
        });
        
        return localId;
      } catch (error) {
        console.error('Ошибка создания транзакции:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Инвалидируем кеш локальных транзакций
      queryClient.invalidateQueries({ queryKey: ['transactions', 'local'] });
    },
  });
  
  // Мутация для обновления транзакции
  const updateMutation = useMutation({
    mutationFn: async (transaction: Transaction) => {
      try {
        // Добавляем метку времени
        const updatedTransaction = {
          ...transaction,
          updatedAt: new Date().toISOString(),
        };
        
        // Сохраняем транзакцию локально
        await saveToIndexedDB('transactions', updatedTransaction);
        
        // Добавляем в очередь синхронизации
        await addToSyncQueue({
          type: 'transaction',
          action: 'update',
          data: updatedTransaction,
          id: transaction.id,
        });
        
        return transaction.id;
      } catch (error) {
        console.error('Ошибка обновления транзакции:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Инвалидируем кеш локальных транзакций
      queryClient.invalidateQueries({ queryKey: ['transactions', 'local'] });
    },
  });
  
  // Мутация для удаления транзакции
  const deleteMutation = useMutation({
    mutationFn: async (id: string | number) => {
      try {
        // Получаем транзакцию перед удалением
        const result = await getFromIndexedDB('transactions', id);
        
        if (!result) {
          throw new Error('Транзакция не найдена');
        }
        
        // Удаляем транзакцию локально
        await removeFromIndexedDB('transactions', id);
        
        // Добавляем в очередь синхронизации
        await addToSyncQueue({
          type: 'transaction',
          action: 'delete',
          data: { id },
          id,
        });
        
        return id;
      } catch (error) {
        console.error('Ошибка удаления транзакции:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Инвалидируем кеш локальных транзакций
      queryClient.invalidateQueries({ queryKey: ['transactions', 'local'] });
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

/**
 * Фильтрует транзакции согласно параметрам запроса
 * @param transactions Массив транзакций
 * @param params Параметры запроса
 * @returns Отфильтрованный массив транзакций
 */
function filterTransactions(transactions: Transaction[], params: {
  page: number;
  perPage: number;
  description: string;
  tags: string[];
  startDate?: number;
  endDate?: number;
  sessionId?: number;
  groupBySession?: boolean;
}): Transaction[] | { sessionGroups: { id: number, name: string | null, transactions: Transaction[] }[], ungroupedTransactions: Transaction[] } {
  // Фильтруем по описанию
  let filtered = transactions;
  
  if (params.description) {
    filtered = filtered.filter(t => 
      t.description.toLowerCase().includes(params.description.toLowerCase())
    );
  }
  
  // Фильтруем по тегам
  if (params.tags.length > 0) {
    filtered = filtered.filter(t => {
      if (!t.tags || !Array.isArray(t.tags)) return false;
      return params.tags.every(tag => t.tags?.includes(tag) ?? false);
    });
  }
  
  // Фильтруем по дате
  if (params.startDate) {
    const startDate = new Date(params.startDate);
    filtered = filtered.filter(t => new Date(t.createdAt) >= startDate);
  }
  
  if (params.endDate && params.endDate !== -1) {
    const endDate = new Date(params.endDate);
    filtered = filtered.filter(t => new Date(t.createdAt) <= endDate);
  }
  
  // Фильтруем по ID сессии
  if (params.sessionId) {
    filtered = filtered.filter(t => t.session?.id === params.sessionId);
  }
  
  // Сортируем по дате создания (новые в начале)
  filtered = filtered.sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  
  // Если нужна группировка по сессиям
  if (params.groupBySession) {
    // Группируем транзакции по сессиям
    const sessionGroups: { id: number | string, name: string | null, transactions: Transaction[] }[] = [];
    const ungroupedTransactions: Transaction[] = [];
    
    // Группируем транзакции по сессиям
    filtered.forEach(transaction => {
      if (transaction.session) {
        const sessionId = transaction.session.id;
        let group = sessionGroups.find(g => g.id === sessionId);
        
        if (!group) {
          group = {
            id: sessionId,
            name: transaction.session.name,
            transactions: []
          };
          sessionGroups.push(group);
        }
        
        group.transactions.push(transaction);
      } else {
        ungroupedTransactions.push(transaction);
      }
    });
    
    // Добавляем логирование для отладки
    console.log('Группированные данные:', { sessionGroups, ungroupedTransactions });
    
    // Возвращаем группированные данные в формате, ожидаемом компонентом
    return {
      sessionGroups,
      ungroupedTransactions
    };
  }
  
  // Применяем пагинацию
  const start = (params.page - 1) * params.perPage;
  const end = start + params.perPage;
  
  return filtered.slice(start, end);
}