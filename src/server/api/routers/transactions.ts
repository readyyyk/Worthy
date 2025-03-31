import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { and, desc, eq, gte, inArray, like, lte, sql } from 'drizzle-orm';
import { transactionsTable } from '@/server/db/tables/transaction';
import { TransactionCreateSchema } from '@/types/transaction';
import { z } from 'zod';
import { tagsTable } from '@/server/db/tables/tags';
import { sessionTransactionsTable } from '@/server/db/tables/session_transaction';
import { shoppingSessionsTable } from '@/server/db/tables/shopping_session';
import { usersTable } from '@/server/db/tables/user';
import { type SQL } from 'drizzle-orm/sql/sql';

export const transactionsRouter = createTRPCRouter({
    getSingle: protectedProcedure
        .input(z.number())
        .query(async ({ ctx, input }) => {
            const resp = await ctx.db
                .select()
                .from(transactionsTable)
                .where(and(
                    eq(transactionsTable.id, input),
                    eq(transactionsTable.ownerId, ctx.session.user.id),
                ))

            if (!resp[0]) {
                return null;
            }

            // Получаем теги для транзакции
            const tags = await ctx.db
                .select({ text: tagsTable.text })
                .from(tagsTable)
                .where(eq(tagsTable.transactionId, input));

            // Получаем информацию о сессии, если транзакция входит в сессию
            const sessionInfo = await ctx.db
                .select({
                    sessionId: sessionTransactionsTable.sessionId,
                    sessionName: shoppingSessionsTable.name,
                    sessionCreatedAt: shoppingSessionsTable.createdAt,
                })
                .from(sessionTransactionsTable)
                .innerJoin(
                    shoppingSessionsTable,
                    eq(shoppingSessionsTable.id, sessionTransactionsTable.sessionId)
                )
                .where(eq(sessionTransactionsTable.transactionId, input));

            return {
                ...resp[0],
                amount: resp[0].amount / 100,
                tags: tags.map(tag => tag.text),
                session: sessionInfo[0] ? {
                    id: sessionInfo[0].sessionId,
                    name: sessionInfo[0].sessionName,
                    createdAt: sessionInfo[0].sessionCreatedAt,
                } : null,
            };
        }),
    delete: protectedProcedure
        .input(z.number())
        .mutation(async ({ ctx, input }) => {
            const transaction = await ctx.db
                .select({
                    amount: transactionsTable.amount,
                    isIncome: transactionsTable.isIncome,
                })
                .from(transactionsTable)
                .where(and(
                    eq(transactionsTable.id, input),
                    eq(transactionsTable.ownerId, ctx.session.user.id),
                ));

            if (!transaction[0]) {
                return false;
            }

            const formatted = transaction[0].amount;
            if (transaction[0].isIncome) {
                await ctx.db
                    .update(usersTable)
                    .set({ balance: sql`${usersTable.balance} - ${formatted}` })
                    .where(eq(usersTable.id, ctx.session.user.id));
            } else {
                await ctx.db
                    .update(usersTable)
                    .set({ balance: sql`${usersTable.balance} + ${formatted}` })
                    .where(eq(usersTable.id, ctx.session.user.id));
            }

            await ctx.db
                .delete(transactionsTable)
                .where(eq(transactionsTable.id, input));

            return true;
        }),
    getList: protectedProcedure
        .input(z.object({
            page: z.number(),
            perPage: z.number(),
            description: z.string().optional(),
            tags: z.array(z.string()).optional(),
            startDate: z.number().optional(),
            endDate: z.number().optional(),
            sessionId: z.number().optional(), // Добавляем возможность фильтрации по ID сессии
            groupBySession: z.boolean().optional(), // Добавляем возможность группировки по сессиям
        }))
        .query(async ({ ctx, input }) => {
            type Transaction = Omit<typeof transactionsTable.$inferSelect, 'ownerId'>;

            // if tags in input create this 2 sub queries that eval into [tr.id]
            let tagsCondition: SQL<unknown>;
            if (input.tags?.length) {
                const wildcard = '%' + input.tags.map(() => ',').slice(0, -1).join('%') + '%';
                const sq1 = ctx.db
                    .select({
                        transaction_id: tagsTable.transactionId,
                        matched_tags_str: sql`GROUP_CONCAT(${tagsTable.text})`.as('matched_tags_str'),
                    })
                    .from(tagsTable)
                    .where(inArray(tagsTable.text, input.tags))
                    .groupBy(tagsTable.transactionId)
                    .as('sq1');
                const sq2 = ctx.db
                    .select({
                        transaction_id: sq1.transaction_id,
                    })
                    .from(sq1)
                    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                    // @ts-ignore - according to drizzleOrm docs, aliased field is used correctly, but aliased have different signature
                    .where(like(sq1.matched_tags_str, wildcard));
                tagsCondition = inArray(transactionsTable.id, sq2);
            } else {
                tagsCondition = sql`1=1`;
            }

            // main query
            const resp: (Transaction & { tags: string | null, sessionId: number | null, sessionName: string | null })[] = await ctx.db.select({
                    id: transactionsTable.id,
                    isIncome: transactionsTable.isIncome,
                    amount: transactionsTable.amount,
                    currency: transactionsTable.currency,
                    description: transactionsTable.description,
                    createdAt: transactionsTable.createdAt,
                    tags: sql<string | null>`GROUP_CONCAT(${tagsTable.text})`.as('tags'),
                    sessionId: sessionTransactionsTable.sessionId,
                    sessionName: shoppingSessionsTable.name,
                })
                .from(transactionsTable)
                .leftJoin(
                    sessionTransactionsTable,
                    eq(sessionTransactionsTable.transactionId, transactionsTable.id)
                )
                .leftJoin(
                    shoppingSessionsTable,
                    eq(shoppingSessionsTable.id, sessionTransactionsTable.sessionId)
                )
                .where(and(
                    eq(transactionsTable.ownerId, ctx.session.user.id),
                    like(transactionsTable.description, `%${input.description}%`),
                    gte(transactionsTable.createdAt, new Date(input.startDate ?? 1)),
                    lte(transactionsTable.createdAt,
                        input.endDate !== -1 && input.endDate !== undefined
                            ? new Date(input.endDate)
                            : new Date()
                    ),
                    tagsCondition,
                    // Если указан sessionId, фильтруем по нему
                    input.sessionId
                        ? eq(sessionTransactionsTable.sessionId, input.sessionId)
                        : sql`1=1`,
                ))
                .offset((input.page - 1) * input.perPage)
                .groupBy(transactionsTable.id)
                .orderBy(desc(transactionsTable.createdAt))
                .limit(input.perPage)
                .leftJoin(tagsTable, eq(tagsTable.transactionId, transactionsTable.id));

            // Если нужна группировка по сессиям, сначала получаем все сессии
            let sessionGroups: { id: number, name: string | null, transactions: any[] }[] = [];
            let ungroupedTransactions: any[] = [];
            
            if (input.groupBySession) {
                // Получаем все сессии, в которые входят транзакции из результата
                const sessionIds = resp
                    .filter(t => t.sessionId !== null)
                    .map(t => t.sessionId as number);
                
                if (sessionIds.length > 0) {
                    const uniqueSessionIds = [...new Set(sessionIds)];
                    
                    // Создаем группы для каждой сессии
                    sessionGroups = uniqueSessionIds.map(sessionId => {
                        const firstTransaction = resp.find(t => t.sessionId === sessionId);
                        return {
                            id: sessionId,
                            name: firstTransaction?.sessionName ?? null,
                            transactions: [],
                        };
                    });
                }
            }

            // adjusting response
            const result = resp.reduce((acc, el) => {
                const tags = el.tags?.split(',') ?? [];
                const transaction = {
                    ...el,
                    tags: tags,
                    amount: el.amount / 100,
                    session: el.sessionId ? {
                        id: el.sessionId,
                        name: el.sessionName,
                    } : null,
                };
                // Создаем новый объект без ненужных полей
                const cleanTransaction = {
                    ...transaction,
                };
                
                // Удаляем ненужные поля из нового объекта
                if ('sessionId' in cleanTransaction) {
                    delete (cleanTransaction as any).sessionId;
                }
                if ('sessionName' in cleanTransaction) {
                    delete (cleanTransaction as any).sessionName;
                }
                
                // Если нужна группировка по сессиям, добавляем транзакцию в соответствующую группу
                if (input.groupBySession) {
                    if (transaction.session) {
                        const sessionGroup = sessionGroups.find(g => g.id === cleanTransaction.session?.id);
                        if (sessionGroup) {
                            sessionGroup.transactions.push(cleanTransaction);
                            return acc;
                        }
                    } else {
                        ungroupedTransactions.push(cleanTransaction);
                        return acc;
                    }
                }
                
                return [...acc, cleanTransaction];
            }, [] as (Transaction & { tags: string[], session: { id: number, name: string | null } | null })[]);

            // Если нужна группировка по сессиям, возвращаем группы и негруппированные транзакции
            if (input.groupBySession) {
                return {
                    sessionGroups,
                    ungroupedTransactions,
                };
            }
            
            return result;
        }),
    getRecent: protectedProcedure.query(async ({ ctx }) => {
        const resp = await ctx.db
            .select()
            .from(transactionsTable)
            .where(eq(transactionsTable.ownerId, ctx.session.user.id))
            .orderBy(desc(transactionsTable.createdAt))
            .limit(3);


        return resp?.map(el => {
            return {
                ...el,
                amount: el.amount / 100,
            };
        });
    }),

    update: protectedProcedure
        .input(TransactionCreateSchema
            .omit({ ownerId: true })
            .extend({
                id: z.number(),
                tags: z.array(z.string())
            }),
        )
        .mutation(async ({ ctx, input }) => {
            try {
                // 1. Получаем текущую транзакцию
                const currentTransaction = await ctx.db
                    .select({
                        amount: transactionsTable.amount,
                        isIncome: transactionsTable.isIncome,
                        ownerId: transactionsTable.ownerId,
                    })
                    .from(transactionsTable)
                    .where(eq(transactionsTable.id, input.id));

                // Проверяем, что транзакция существует и принадлежит пользователю
                if (!currentTransaction[0]) {
                    throw new Error("Транзакция не найдена");
                }
                
                if (currentTransaction[0].ownerId !== ctx.session.user.id) {
                    throw new Error("У вас нет прав на редактирование этой транзакции");
                }

                const { tags, id, ...rest } = input;
                const formatted = Math.floor(input.amount * 100);
                const currentAmount = currentTransaction[0].amount;
                const currentIsIncome = currentTransaction[0].isIncome;


                // Используем транзакцию базы данных для обеспечения согласованности данных
                // Все операции должны выполниться успешно или ни одна из них
                await ctx.db.transaction(async (tx) => {
                    // 2. Обновляем баланс пользователя
                    // Если тип транзакции не изменился
                    if (currentIsIncome === input.isIncome) {
                        const difference = formatted - currentAmount;
                        
                        if (difference !== 0) {
                            if (input.isIncome) {
                                // Для дохода: если сумма увеличилась, добавляем разницу к балансу
                                await tx
                                    .update(usersTable)
                                    .set({ balance: sql`${usersTable.balance} + ${difference}` })
                                    .where(eq(usersTable.id, ctx.session.user.id));
                            } else {
                                // Для расхода: если сумма увеличилась, вычитаем разницу из баланса
                                await tx
                                    .update(usersTable)
                                    .set({ balance: sql`${usersTable.balance} - ${difference}` })
                                    .where(eq(usersTable.id, ctx.session.user.id));
                            }
                        }
                    }
                    // Если тип транзакции изменился
                    else {
                        // Отменяем старую транзакцию
                        if (currentIsIncome) {
                            // Если была доходом, вычитаем из баланса
                            await tx
                                .update(usersTable)
                                .set({ balance: sql`${usersTable.balance} - ${currentAmount}` })
                                .where(eq(usersTable.id, ctx.session.user.id));
                        } else {
                            // Если была расходом, добавляем к балансу
                            await tx
                                .update(usersTable)
                                .set({ balance: sql`${usersTable.balance} + ${currentAmount}` })
                                .where(eq(usersTable.id, ctx.session.user.id));
                        }
                        
                        // Применяем новую транзакцию
                        if (input.isIncome) {
                            // Если стала доходом, добавляем к балансу
                            await tx
                                .update(usersTable)
                                .set({ balance: sql`${usersTable.balance} + ${formatted}` })
                                .where(eq(usersTable.id, ctx.session.user.id));
                        } else {
                            // Если стала расходом, вычитаем из баланса
                            await tx
                                .update(usersTable)
                                .set({ balance: sql`${usersTable.balance} - ${formatted}` })
                                .where(eq(usersTable.id, ctx.session.user.id));
                        }
                    }

                    // 3. Обновляем транзакцию
                    const updateResult = await tx
                        .update(transactionsTable)
                        .set({
                            ...rest,
                            amount: formatted,
                        })
                        .where(eq(transactionsTable.id, id));

                    // 4. Обновляем теги (удаляем старые, добавляем новые)
                    await tx
                        .delete(tagsTable)
                        .where(eq(tagsTable.transactionId, id));

                    if (tags?.length) {
                        const tagsValues: (typeof tagsTable.$inferInsert)[] = tags.map((el) => {
                            return {
                                transactionId: id,
                                text: el,
                            };
                        });

                        await tx
                            .insert(tagsTable)
                            .values(tagsValues);
                    }
                });

                return true;
            } catch (error) {
                throw error;
            }
        }),

    create: protectedProcedure
        .input(TransactionCreateSchema
            .omit({ ownerId: true })
            .extend({
                tags: z.array(z.string()),
                sessionId: z.number().optional(), // ID существующей сессии
                createSession: z.boolean().optional(), // Создать новую сессию
                sessionName: z.string().optional(), // Название новой сессии
            }),
        )
        .mutation(async ({ ctx, input }) => {
            // Используем транзакцию базы данных для обеспечения согласованности данных
            return await ctx.db.transaction(async (tx) => {
                const { tags, sessionId, createSession, sessionName, ...rest } = input;
                const formatted = Math.floor(input.amount * 100);
                const toInsert: (typeof transactionsTable.$inferInsert) = {
                    ...rest,
                    amount: formatted,
                    ownerId: ctx.session.user.id,
                };

                const resp = await tx
                    .insert(transactionsTable)
                    .values(toInsert)
                    .returning({ insertedId: transactionsTable.id });

                if (input.isIncome) {
                    await tx
                        .update(usersTable)
                        .set({ balance: sql`${usersTable.balance} + ${formatted}` })
                        .where(eq(usersTable.id, ctx.session.user.id));
                } else {
                    await tx
                        .update(usersTable)
                        .set({ balance: sql`${usersTable.balance} - ${formatted}` })
                        .where(eq(usersTable.id, ctx.session.user.id));
                }

                const transactionId = Number(resp[0]!.insertedId);

                // Добавляем теги, если они есть
                if (tags?.length) {
                    const tagsValues: (typeof tagsTable.$inferInsert)[] = tags.map((el) => {
                        return {
                            transactionId,
                            text: el,
                        };
                    });

                    await tx
                        .insert(tagsTable)
                        .values(tagsValues);
                }

                // Если указан ID существующей сессии, добавляем транзакцию в неё
                if (sessionId) {
                    // Проверяем, что сессия существует и принадлежит пользователю
                    const session = await tx
                        .select({ id: shoppingSessionsTable.id })
                        .from(shoppingSessionsTable)
                        .where(and(
                            eq(shoppingSessionsTable.id, sessionId),
                            eq(shoppingSessionsTable.ownerId, ctx.session.user.id)
                        ));

                    if (!session[0]) {
                        throw new Error('Сессия не найдена или не принадлежит пользователю');
                    }

                    // Добавляем транзакцию в сессию
                    await tx
                        .insert(sessionTransactionsTable)
                        .values({
                            sessionId,
                            transactionId,
                        });
                }
                // Если нужно создать новую сессию
                else if (createSession) {
                    // Создаем новую сессию
                    const session = await tx
                        .insert(shoppingSessionsTable)
                        .values({
                            ownerId: ctx.session.user.id,
                            name: sessionName || null,
                        })
                        .returning({ id: shoppingSessionsTable.id });

                    if (!session[0]) {
                        throw new Error('Не удалось создать сессию');
                    }

                    const newSessionId = session[0].id;

                    // Добавляем транзакцию в новую сессию
                    await tx
                        .insert(sessionTransactionsTable)
                        .values({
                            sessionId: newSessionId,
                            transactionId,
                        });
                }

                return true;
            });

        }),
});
