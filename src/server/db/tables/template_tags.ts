import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { templatesTable } from '@/server/db/tables/template';

export const templateTagsTable = sqliteTable('template_tags', {
    id: int('id').primaryKey({ autoIncrement: true }).notNull(),
    templateId: int('template_id').notNull().references(() => templatesTable.id, { onDelete: 'cascade' }),
    text: text('text').notNull(),
});