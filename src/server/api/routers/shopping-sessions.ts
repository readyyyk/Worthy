import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { and, desc, eq, inArray, sql, gte, or } from 'drizzle-orm';
import { shoppingSessionsTable } from '@/server/db/tables/shopping_session';
import { sessionTransactionsTable } from '@/server/db/tables/session_transaction';
import { transactionsTable } from '@/server/db/tables/transaction';
import { ShoppingSessionCreateSchema, ShoppingSessionUpdateSchema } from '@/types/shopping-session';
import { z } from 'zod';
import { tagsTable } from '@/server/db/tables/tags';

export const shoppingSessionsRouter = createTRPCRouter({
    // Создание новой сессии
    createSession: protectedProcedure
        .input(ShoppingSessionCreateSchema)
        .mutation(async ({ ctx, input }) => {
            const { transactionIds, ...sessionData } = input;

            // Проверяем, что все транзакции принадлежат пользователю
            const userTransactions = await ctx.db
                .select({ id: transactionsTable.id })
                .from(transactionsTable)
                .where(and(
                    eq(transactionsTable.ownerId, ctx.session.user.id),
                    inArray(transactionsTable.id, transactionIds)
                ));

            if (userTransactions.length !== transactionIds.length) {
                throw new Error('Некоторые транзакции не найдены или не принадлежат пользователю');
            }

            // Используем транзакцию базы данных для обеспечения согласованности данных
            return await ctx.db.transaction(async (tx) => {
                // Создаем сессию
                const session = await tx
                    .insert(shoppingSessionsTable)
                    .values({
                        ...sessionData,
                        ownerId: ctx.session.user.id,
                    })
                    .returning({ id: shoppingSessionsTable.id });

                if (!session[0]) {
                    throw new Error('Не удалось создать сессию');
                }

                const sessionId = session[0].id;

                // Добавляем транзакции в сессию
                if (transactionIds.length > 0) {
                    const sessionTransactions = transactionIds.map(transactionId => ({
                        sessionId,
                        transactionId,
                    }));

                    await tx
                        .insert(sessionTransactionsTable)
                        .values(sessionTransactions);
                }

                return { id: sessionId };
            });
        }),

    // Обновление существующей сессии
    updateSession: protectedProcedure
        .input(ShoppingSessionUpdateSchema)
        .mutation(async ({ ctx, input }) => {
            const { id, name, addTransactionIds, removeTransactionIds } = input;

            // Проверяем, что сессия существует и принадлежит пользователю
            const session = await ctx.db
                .select({ id: shoppingSessionsTable.id })
                .from(shoppingSessionsTable)
                .where(and(
                    eq(shoppingSessionsTable.id, id),
                    eq(shoppingSessionsTable.ownerId, ctx.session.user.id)
                ));

            if (!session[0]) {
                throw new Error('Сессия не найдена или не принадлежит пользователю');
            }

            // Используем транзакцию базы данных для обеспечения согласованности данных
            return await ctx.db.transaction(async (tx) => {
                // Обновляем название сессии, если оно предоставлено
                if (name !== undefined) {
                    await tx
                        .update(shoppingSessionsTable)
                        .set({ name })
                        .where(eq(shoppingSessionsTable.id, id));
                }

                // Добавляем новые транзакции в сессию, если они предоставлены
                if (addTransactionIds && addTransactionIds.length > 0) {
                    // Проверяем, что все транзакции принадлежат пользователю
                    const userTransactions = await tx
                        .select({ id: transactionsTable.id })
                        .from(transactionsTable)
                        .where(and(
                            eq(transactionsTable.ownerId, ctx.session.user.id),
                            inArray(transactionsTable.id, addTransactionIds)
                        ));

                    if (userTransactions.length !== addTransactionIds.length) {
                        throw new Error('Некоторые транзакции не найдены или не принадлежат пользователю');
                    }

                    // Получаем список транзакций, которые уже в сессии
                    const existingTransactions = await tx
                        .select({ transactionId: sessionTransactionsTable.transactionId })
                        .from(sessionTransactionsTable)
                        .where(and(
                            eq(sessionTransactionsTable.sessionId, id),
                            inArray(sessionTransactionsTable.transactionId, addTransactionIds)
                        ));

                    const existingTransactionIds = existingTransactions.map(t => t.transactionId);
                    
                    // Фильтруем только новые транзакции
                    const newTransactionIds = addTransactionIds.filter(
                        transactionId => !existingTransactionIds.includes(transactionId)
                    );

                    if (newTransactionIds.length > 0) {
                        const sessionTransactions = newTransactionIds.map(transactionId => ({
                            sessionId: id,
                            transactionId,
                        }));

                        await tx
                            .insert(sessionTransactionsTable)
                            .values(sessionTransactions);
                    }
                }

                // Удаляем транзакции из сессии, если они предоставлены
                if (removeTransactionIds && removeTransactionIds.length > 0) {
                    await tx
                        .delete(sessionTransactionsTable)
                        .where(and(
                            eq(sessionTransactionsTable.sessionId, id),
                            inArray(sessionTransactionsTable.transactionId, removeTransactionIds)
                        ));
                }

                return { success: true };
            });
        }),

    // Удаление сессии
    deleteSession: protectedProcedure
        .input(z.number())
        .mutation(async ({ ctx, input }) => {
            // Проверяем, что сессия существует и принадлежит пользователю
            const session = await ctx.db
                .select({ id: shoppingSessionsTable.id })
                .from(shoppingSessionsTable)
                .where(and(
                    eq(shoppingSessionsTable.id, input),
                    eq(shoppingSessionsTable.ownerId, ctx.session.user.id)
                ));

            if (!session[0]) {
                throw new Error('Сессия не найдена или не принадлежит пользователю');
            }

            // Удаляем сессию (связанные записи в session_transactions будут удалены каскадно)
            await ctx.db
                .delete(shoppingSessionsTable)
                .where(eq(shoppingSessionsTable.id, input));

            return { success: true };
        }),

    // Получение списка всех сессий пользователя
    getSessionsList: protectedProcedure
        .input(z.object({
            page: z.number().default(1),
            perPage: z.number().default(10),
        }))
        .query(async ({ ctx, input }) => {
            const { page, perPage } = input;

            // Получаем список сессий
            const sessions = await ctx.db
                .select({
                    id: shoppingSessionsTable.id,
                    name: shoppingSessionsTable.name,
                    createdAt: shoppingSessionsTable.createdAt,
                    autoGenerated: shoppingSessionsTable.autoGenerated,
                    transactionCount: sql<number>`COUNT(DISTINCT ${sessionTransactionsTable.transactionId})`.as('transaction_count'),
                })
                .from(shoppingSessionsTable)
                .leftJoin(
                    sessionTransactionsTable,
                    eq(sessionTransactionsTable.sessionId, shoppingSessionsTable.id)
                )
                .where(eq(shoppingSessionsTable.ownerId, ctx.session.user.id))
                .groupBy(shoppingSessionsTable.id)
                .orderBy(desc(shoppingSessionsTable.createdAt))
                .limit(perPage)
                .offset((page - 1) * perPage);

            // Для каждой сессии получаем общую сумму транзакций
            const sessionsWithTotals = await Promise.all(
                sessions.map(async (session) => {
                    const transactions = await ctx.db
                        .select({
                            amount: transactionsTable.amount,
                            isIncome: transactionsTable.isIncome,
                            currency: transactionsTable.currency,
                        })
                        .from(transactionsTable)
                        .innerJoin(
                            sessionTransactionsTable,
                            eq(sessionTransactionsTable.transactionId, transactionsTable.id)
                        )
                        .where(eq(sessionTransactionsTable.sessionId, session.id));

                    // Группируем транзакции по валюте
                    const totals = transactions.reduce((acc, transaction) => {
                        const currency = transaction.currency;
                        if (!acc[currency]) {
                            acc[currency] = 0;
                        }
                        
                        const amount = transaction.amount / 100; // Конвертируем в правильный формат
                        acc[currency] += transaction.isIncome ? amount : -amount;
                        
                        return acc;
                    }, {} as Record<string, number>);

                    return {
                        ...session,
                        totals,
                    };
                })
            );

            return sessionsWithTotals;
        }),

    // Получение детальной информации о сессии
    getSessionDetails: protectedProcedure
        .input(z.number())
        .query(async ({ ctx, input }) => {
            // Получаем информацию о сессии
            const session = await ctx.db
                .select({
                    id: shoppingSessionsTable.id,
                    name: shoppingSessionsTable.name,
                    createdAt: shoppingSessionsTable.createdAt,
                    autoGenerated: shoppingSessionsTable.autoGenerated,
                })
                .from(shoppingSessionsTable)
                .where(and(
                    eq(shoppingSessionsTable.id, input),
                    eq(shoppingSessionsTable.ownerId, ctx.session.user.id)
                ));

            if (!session[0]) {
                throw new Error('Сессия не найдена или не принадлежит пользователю');
            }

            // Получаем все транзакции в сессии
            const transactionIds = await ctx.db
                .select({ id: sessionTransactionsTable.transactionId })
                .from(sessionTransactionsTable)
                .where(eq(sessionTransactionsTable.sessionId, input));

            const transactionIdList = transactionIds.map(t => t.id);

            if (transactionIdList.length === 0) {
                return {
                    ...session[0],
                    transactions: [],
                    totals: {},
                };
            }

            // Получаем детальную информацию о транзакциях
            const transactions = await ctx.db
                .select({
                    id: transactionsTable.id,
                    amount: transactionsTable.amount,
                    isIncome: transactionsTable.isIncome,
                    currency: transactionsTable.currency,
                    description: transactionsTable.description,
                    createdAt: transactionsTable.createdAt,
                })
                .from(transactionsTable)
                .where(inArray(transactionsTable.id, transactionIdList))
                .orderBy(desc(transactionsTable.createdAt));

            // Получаем теги для каждой транзакции
            const transactionsWithTags = await Promise.all(
                transactions.map(async (transaction) => {
                    const tags = await ctx.db
                        .select({ text: tagsTable.text })
                        .from(tagsTable)
                        .where(eq(tagsTable.transactionId, transaction.id));

                    return {
                        ...transaction,
                        amount: transaction.amount / 100, // Конвертируем в правильный формат
                        tags: tags.map(tag => tag.text),
                    };
                })
            );

            // Рассчитываем общую сумму по валютам
            const totals = transactionsWithTags.reduce((acc, transaction) => {
                const currency = transaction.currency;
                if (!acc[currency]) {
                    acc[currency] = 0;
                }
                
                acc[currency] += transaction.isIncome ? transaction.amount : -transaction.amount;
                
                return acc;
            }, {} as Record<string, number>);

            return {
                ...session[0],
                transactions: transactionsWithTags,
                totals,
            };
        }),

    // Добавление транзакций в существующую сессию
    addTransactionsToSession: protectedProcedure
        .input(z.object({
            sessionId: z.number(),
            transactionIds: z.array(z.number()),
        }))
        .mutation(async ({ ctx, input }) => {
            const { sessionId, transactionIds } = input;

            if (transactionIds.length === 0) {
                return { success: true };
            }

            // Проверяем, что сессия существует и принадлежит пользователю
            const session = await ctx.db
                .select({ id: shoppingSessionsTable.id })
                .from(shoppingSessionsTable)
                .where(and(
                    eq(shoppingSessionsTable.id, sessionId),
                    eq(shoppingSessionsTable.ownerId, ctx.session.user.id)
                ));

            if (!session[0]) {
                throw new Error('Сессия не найдена или не принадлежит пользователю');
            }

            // Проверяем, что все транзакции принадлежат пользователю
            const userTransactions = await ctx.db
                .select({ id: transactionsTable.id })
                .from(transactionsTable)
                .where(and(
                    eq(transactionsTable.ownerId, ctx.session.user.id),
                    inArray(transactionsTable.id, transactionIds)
                ));

            if (userTransactions.length !== transactionIds.length) {
                throw new Error('Некоторые транзакции не найдены или не принадлежат пользователю');
            }

            // Получаем список транзакций, которые уже в сессии
            const existingTransactions = await ctx.db
                .select({ transactionId: sessionTransactionsTable.transactionId })
                .from(sessionTransactionsTable)
                .where(and(
                    eq(sessionTransactionsTable.sessionId, sessionId),
                    inArray(sessionTransactionsTable.transactionId, transactionIds)
                ));

            const existingTransactionIds = existingTransactions.map(t => t.transactionId);
            
            // Фильтруем только новые транзакции
            const newTransactionIds = transactionIds.filter(
                transactionId => !existingTransactionIds.includes(transactionId)
            );

            if (newTransactionIds.length > 0) {
                const sessionTransactions = newTransactionIds.map(transactionId => ({
                    sessionId,
                    transactionId,
                }));

                await ctx.db
                    .insert(sessionTransactionsTable)
                    .values(sessionTransactions);
            }

            return { success: true };
        }),

    // Удаление транзакций из сессии
    removeTransactionsFromSession: protectedProcedure
        .input(z.object({
            sessionId: z.number(),
            transactionIds: z.array(z.number()),
        }))
        .mutation(async ({ ctx, input }) => {
            const { sessionId, transactionIds } = input;

            if (transactionIds.length === 0) {
                return { success: true };
            }

            // Проверяем, что сессия существует и принадлежит пользователю
            const session = await ctx.db
                .select({ id: shoppingSessionsTable.id })
                .from(shoppingSessionsTable)
                .where(and(
                    eq(shoppingSessionsTable.id, sessionId),
                    eq(shoppingSessionsTable.ownerId, ctx.session.user.id)
                ));

            if (!session[0]) {
                throw new Error('Сессия не найдена или не принадлежит пользователю');
            }

            // Удаляем транзакции из сессии
            await ctx.db
                .delete(sessionTransactionsTable)
                .where(and(
                    eq(sessionTransactionsTable.sessionId, sessionId),
                    inArray(sessionTransactionsTable.transactionId, transactionIds)
                ));

            return { success: true };
        }),

    // Поиск похожих транзакций для автоматического создания сессии
    findSimilarTransactions: protectedProcedure
        .input(z.object({
            description: z.string(),
            timeWindowMinutes: z.number().default(30),
        }))
        .query(async ({ ctx, input }) => {
            const { description, timeWindowMinutes } = input;

            // Извлекаем ключевые слова из описания
            const keywords = extractKeywords(description);
            
            if (keywords.length === 0) {
                return [];
            }

            // Определяем временное окно
            const timeWindow = new Date();
            timeWindow.setMinutes(timeWindow.getMinutes() - timeWindowMinutes);
            
            // Создаем условия для поиска по ключевым словам
            const keywordConditions = keywords.map(keyword => 
                sql`${transactionsTable.description} LIKE ${'%' + keyword + '%'}`
            );

            // Ищем похожие транзакции
            const similarTransactions = await ctx.db
                .select({
                    id: transactionsTable.id,
                    amount: transactionsTable.amount,
                    isIncome: transactionsTable.isIncome,
                    currency: transactionsTable.currency,
                    description: transactionsTable.description,
                    createdAt: transactionsTable.createdAt,
                })
                .from(transactionsTable)
                .where(and(
                    eq(transactionsTable.ownerId, ctx.session.user.id),
                    gte(transactionsTable.createdAt, timeWindow),
                    or(...keywordConditions)
                ))
                .orderBy(desc(transactionsTable.createdAt));

            // Получаем теги для каждой транзакции
            const transactionsWithTags = await Promise.all(
                similarTransactions.map(async (transaction) => {
                    const tags = await ctx.db
                        .select({ text: tagsTable.text })
                        .from(tagsTable)
                        .where(eq(tagsTable.transactionId, transaction.id));

                    return {
                        ...transaction,
                        amount: transaction.amount / 100, // Конвертируем в правильный формат
                        tags: tags.map(tag => tag.text),
                    };
                })
            );

            return transactionsWithTags;
        }),
});

// Функция для извлечения ключевых слов из описания
function extractKeywords(description: string): string[] {
    // Простая реализация - разбиваем по пробелам и фильтруем короткие слова
    return description
        .toLowerCase()
        .split(/\s+/)
        .filter(word => word.length > 3)
        .slice(0, 3); // Берем до 3 ключевых слов
}