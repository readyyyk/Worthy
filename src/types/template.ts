import type { InferSelectModel } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';
import { templatesTable } from '@/server/db/tables/template';

export type Template = InferSelectModel<typeof templatesTable>;
export const TemplateCreateSchema = createInsertSchema(templatesTable);