import { createTRPCRouter, protectedProcedure } from '@/server/api/trpc';
import { templatesTable } from '@/server/db/tables/template';
import { templateTagsTable } from '@/server/db/tables/template_tags';
import { TemplateCreateSchema } from '@/types/template';
import { z } from 'zod';
import { and, eq } from 'drizzle-orm';

export const templatesRouter = createTRPCRouter({
    // Получение списка шаблонов пользователя
    getList: protectedProcedure.query(async ({ ctx }) => {
        const templates = await ctx.db
            .select()
            .from(templatesTable)
            .where(eq(templatesTable.ownerId, ctx.session.user.id));
            
        // Для каждого шаблона получаем его теги
        const result = await Promise.all(templates.map(async (template) => {
            const tags = await ctx.db
                .select({ text: templateTagsTable.text })
                .from(templateTagsTable)
                .where(eq(templateTagsTable.templateId, template.id));
                
            return {
                ...template,
                amount: template.amount / 100, // Форматируем сумму
                tags: tags.map(tag => tag.text),
            };
        }));
        
        return result;
    }),
    
    // Получение одного шаблона по ID
    getSingle: protectedProcedure
        .input(z.number())
        .query(async ({ ctx, input }) => {
            const template = await ctx.db
                .select()
                .from(templatesTable)
                .where(and(
                    eq(templatesTable.id, input),
                    eq(templatesTable.ownerId, ctx.session.user.id),
                ));
                
            if (!template[0]) {
                return null;
            }
            
            // Получаем теги для шаблона
            const tags = await ctx.db
                .select({ text: templateTagsTable.text })
                .from(templateTagsTable)
                .where(eq(templateTagsTable.templateId, input));
                
            return {
                ...template[0],
                amount: template[0].amount / 100, // Форматируем сумму
                tags: tags.map(tag => tag.text),
            };
        }),
    
    // Создание нового шаблона
    create: protectedProcedure
        .input(TemplateCreateSchema
            .omit({ ownerId: true, id: true })
            .extend({
                tags: z.array(z.string()),
                name: z.string(),
                amount: z.number(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const { tags, ...rest } = input;
            const formatted = Math.floor(input.amount * 100);
            
            // Вставляем шаблон
            const toInsert: (typeof templatesTable.$inferInsert) = {
                ...rest,
                amount: formatted,
                ownerId: ctx.session.user.id,
            };
            
            const resp = await ctx.db
                .insert(templatesTable)
                .values(toInsert)
                .returning({ insertedId: templatesTable.id });
                
            if (!tags?.length) {
                return true;
            }
            
            // Вставляем теги для шаблона
            const tagsValues: (typeof templateTagsTable.$inferInsert)[] = tags.map((el) => {
                return {
                    templateId: Number(resp[0]!.insertedId),
                    text: el,
                };
            });
            
            await ctx.db
                .insert(templateTagsTable)
                .values(tagsValues);
                
            return true;
        }),
    
    // Редактирование существующего шаблона
    update: protectedProcedure
        .input(TemplateCreateSchema
            .omit({ ownerId: true })
            .extend({
                id: z.number(),
                tags: z.array(z.string()),
                name: z.string(),
                amount: z.number(),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            try {
                // Проверяем, что шаблон существует и принадлежит пользователю
                const currentTemplate = await ctx.db
                    .select({
                        ownerId: templatesTable.ownerId,
                    })
                    .from(templatesTable)
                    .where(eq(templatesTable.id, input.id));
                    
                if (!currentTemplate[0]) {
                    throw new Error("Шаблон не найден");
                }
                
                if (currentTemplate[0].ownerId !== ctx.session.user.id) {
                    throw new Error("У вас нет прав на редактирование этого шаблона");
                }
                
                const { tags, id, ...rest } = input;
                const formatted = Math.floor(input.amount * 100);
                
                // Используем транзакцию базы данных для обеспечения согласованности данных
                await ctx.db.transaction(async (tx) => {
                    // Обновляем шаблон
                    const toUpdate: Partial<typeof templatesTable.$inferInsert> = {
                        ...rest,
                        amount: formatted,
                    };
                    
                    await tx
                        .update(templatesTable)
                        .set(toUpdate)
                        .where(eq(templatesTable.id, id));
                        
                    // Обновляем теги (удаляем старые, добавляем новые)
                    await tx
                        .delete(templateTagsTable)
                        .where(eq(templateTagsTable.templateId, id));
                        
                    if (tags?.length) {
                        const tagsValues: (typeof templateTagsTable.$inferInsert)[] = tags.map((el) => {
                            return {
                                templateId: id,
                                text: el,
                            };
                        });
                        
                        await tx
                            .insert(templateTagsTable)
                            .values(tagsValues);
                    }
                });
                
                return true;
            } catch (error) {
                throw error;
            }
        }),
    
    // Удаление шаблона
    delete: protectedProcedure
        .input(z.number())
        .mutation(async ({ ctx, input }) => {
            // Проверяем, что шаблон существует и принадлежит пользователю
            const template = await ctx.db
                .select({
                    ownerId: templatesTable.ownerId,
                })
                .from(templatesTable)
                .where(and(
                    eq(templatesTable.id, input),
                    eq(templatesTable.ownerId, ctx.session.user.id),
                ));
                
            if (!template[0]) {
                return false;
            }
            
            // Удаляем шаблон (теги удалятся автоматически благодаря каскадному удалению)
            await ctx.db
                .delete(templatesTable)
                .where(eq(templatesTable.id, input));
                
            return true;
        }),
});