/**
 * Утилиты для заполнения IndexedDB тестовыми данными
 */

import { saveToIndexedDB } from './indexedDB';

/**
 * Создает тестовые транзакции в IndexedDB
 * @returns Promise, который разрешается после создания тестовых данных
 */
export const seedTransactions = async (): Promise<boolean> => {
  try {
    // Создаем тестовые транзакции
    const transactions = [
      {
        id: 'local_1',
        amount: 100,
        isIncome: true,
        currency: 'USD',
        description: 'Зарплата',
        createdAt: new Date(),
        updatedAt: new Date().toISOString(),
        tags: ['работа', 'доход'],
        session: {
          id: 'local_1',
          name: 'Тестовая сессия 1'
        }
      },
      {
        id: 'local_2',
        amount: 50,
        isIncome: false,
        currency: 'USD',
        description: 'Продукты',
        createdAt: new Date(),
        updatedAt: new Date().toISOString(),
        tags: ['еда', 'расход'],
        session: {
          id: 'local_1',
          name: 'Тестовая сессия 1'
        }
      },
      {
        id: 'local_3',
        amount: 30,
        isIncome: false,
        currency: 'USD',
        description: 'Транспорт',
        createdAt: new Date(),
        updatedAt: new Date().toISOString(),
        tags: ['транспорт', 'расход'],
        session: null
      }
    ];
    
    // Сохраняем транзакции в IndexedDB
    for (const transaction of transactions) {
      await saveToIndexedDB('transactions', transaction);
    }
    
    console.log('Тестовые транзакции созданы успешно');
    return true;
  } catch (error) {
    console.error('Ошибка создания тестовых транзакций:', error);
    return false;
  }
};

/**
 * Создает тестовые шаблоны в IndexedDB
 * @returns Promise, который разрешается после создания тестовых данных
 */
export const seedTemplates = async (): Promise<boolean> => {
  try {
    // Создаем тестовые шаблоны
    const templates = [
      {
        id: 'local_1',
        name: 'Зарплата',
        amount: 100,
        isIncome: true,
        currency: 'USD',
        description: 'Ежемесячная зарплата',
        createdAt: new Date(),
        updatedAt: new Date().toISOString(),
        tags: ['работа', 'доход']
      },
      {
        id: 'local_2',
        name: 'Продукты',
        amount: 50,
        isIncome: false,
        currency: 'USD',
        description: 'Еженедельные покупки продуктов',
        createdAt: new Date(),
        updatedAt: new Date().toISOString(),
        tags: ['еда', 'расход']
      }
    ];
    
    // Сохраняем шаблоны в IndexedDB
    for (const template of templates) {
      await saveToIndexedDB('templates', template);
    }
    
    console.log('Тестовые шаблоны созданы успешно');
    return true;
  } catch (error) {
    console.error('Ошибка создания тестовых шаблонов:', error);
    return false;
  }
};

/**
 * Создает тестовые сессии покупок в IndexedDB
 * @returns Promise, который разрешается после создания тестовых данных
 */
export const seedShoppingSessions = async (): Promise<boolean> => {
  try {
    // Создаем тестовые сессии покупок
    const shoppingSessions = [
      {
        id: 'local_1',
        name: 'Поход в магазин',
        createdAt: new Date(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'local_2',
        name: 'Покупки в интернете',
        createdAt: new Date(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    // Сохраняем сессии покупок в IndexedDB
    for (const session of shoppingSessions) {
      await saveToIndexedDB('shoppingSessions', session);
    }
    
    console.log('Тестовые сессии покупок созданы успешно');
    return true;
  } catch (error) {
    console.error('Ошибка создания тестовых сессий покупок:', error);
    return false;
  }
};

/**
 * Создает все тестовые данные в IndexedDB
 * @returns Promise, который разрешается после создания всех тестовых данных
 */
export const seedAllData = async (): Promise<boolean> => {
  try {
    await seedTransactions();
    await seedTemplates();
    await seedShoppingSessions();
    
    console.log('Все тестовые данные созданы успешно');
    return true;
  } catch (error) {
    console.error('Ошибка создания тестовых данных:', error);
    return false;
  }
};